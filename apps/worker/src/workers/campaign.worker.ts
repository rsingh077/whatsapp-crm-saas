import { Worker, Job } from 'bullmq';
import { prisma } from '@hotel-crm/db';
import { createRedisConnection } from '../lib/redis';
import { messageQueue } from '../queues';
import type { CampaignJob, SendMessageJob } from '../queues';

export function createCampaignWorker() {
  const worker = new Worker<CampaignJob>(
    'campaigns',
    async (job: Job<CampaignJob>) => {
      const { campaignId, orgId } = job.data;

      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, orgId },
        include: {
          recipients: {
            where: { status: 'PENDING' },
            include: { guest: true },
          },
        },
      });

      if (!campaign) {
        console.error(`[campaign-worker] Campaign ${campaignId} not found`);
        return;
      }

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: 'SENDING' },
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const recipient of campaign.recipients) {
        try {
          // Create conversation if one doesn't exist
          let conversation = await prisma.conversation.findFirst({
            where: {
              orgId,
              guestId: recipient.guestId,
              status: { in: ['OPEN', 'PENDING'] },
            },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                orgId,
                guestId: recipient.guestId,
                status: 'OPEN',
                lastMessageAt: new Date(),
              },
            });
          }

          // Create message record
          const message = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              direction: 'OUTBOUND',
              type: 'TEMPLATE',
              content: campaign.templateName || campaign.name,
              status: 'PENDING',
            },
          });

          // Enqueue the actual send
          await messageQueue.add('send', {
            orgId,
            conversationId: conversation.id,
            messageId: message.id,
            phone: recipient.guest.phone,
            content: campaign.templateName || campaign.name,
            type: 'template',
            templateName: campaign.templateName || undefined,
            templateLanguage: campaign.templateLanguage || 'en',
          } satisfies SendMessageJob);

          // Mark recipient as sent
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'SENT', sentAt: new Date() },
          });

          sentCount++;
        } catch (error) {
          console.error(
            `[campaign-worker] Failed to process recipient ${recipient.id}:`,
            error,
          );

          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'FAILED' },
          });

          failedCount++;
        }
      }

      // Finalize campaign
      const finalStatus = failedCount === campaign.recipients.length ? 'FAILED' : 'COMPLETED';

      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: finalStatus,
          sentCount,
          completedAt: new Date(),
        },
      });

      console.log(
        `[campaign-worker] Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`,
      );
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[campaign-worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[campaign-worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
