import { Worker, Job } from 'bullmq';
import { prisma } from '@hotel-crm/db';
import { WhatsAppClient } from '@hotel-crm/whatsapp';
import { createRedisConnection } from '../lib/redis';
import type { SendMessageJob } from '../queues';

export function createMessageWorker() {
  const worker = new Worker<SendMessageJob>(
    'messages',
    async (job: Job<SendMessageJob>) => {
      const { orgId, messageId, phone, content, type } = job.data;

      // Get org's WhatsApp credentials
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
      });

      if (!org?.whatsappPhoneNumberId || !org?.whatsappAccessToken) {
        console.log(`[message-worker] Org ${orgId} has no WhatsApp config, skipping`);
        // Mark message as sent anyway (dev mode)
        await prisma.message.update({
          where: { id: messageId },
          data: { status: 'SENT' },
        });
        return;
      }

      const whatsapp = new WhatsAppClient({
        phoneNumberId: org.whatsappPhoneNumberId,
        accessToken: org.whatsappAccessToken,
        businessId: org.whatsappBusinessId || '',
        webhookSecret: org.webhookSecret || '',
      });

      try {
        let result;

        switch (type) {
          case 'text':
            result = await whatsapp.sendText(phone, content);
            break;
          case 'image':
            result = await whatsapp.sendImage(phone, job.data.mediaUrl || '', content);
            break;
          case 'document':
            result = await whatsapp.sendDocument(phone, job.data.mediaUrl || '', content);
            break;
          case 'template':
            result = await whatsapp.sendTemplate(
              phone,
              job.data.templateName || '',
              job.data.templateLanguage || 'en',
              job.data.templateComponents as Array<{ type: string; parameters: Array<{ type: string; text?: string }> }>,
            );
            break;
          default:
            result = await whatsapp.sendText(phone, content);
        }

        await prisma.message.update({
          where: { id: messageId },
          data: {
            whatsappMessageId: result.messages[0]?.id,
            status: 'SENT',
          },
        });

        console.log(`[message-worker] Message ${messageId} sent successfully`);
      } catch (error) {
        console.error(`[message-worker] Failed to send message ${messageId}:`, error);

        await prisma.message.update({
          where: { id: messageId },
          data: { status: 'FAILED' },
        });

        throw error; // Let BullMQ retry
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 80, // WhatsApp rate limit: 80 messages per second for Tier 1
        duration: 1000,
      },
    },
  );

  worker.on('completed', (job) => {
    console.log(`[message-worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[message-worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
