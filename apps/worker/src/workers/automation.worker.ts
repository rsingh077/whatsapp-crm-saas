import { Worker, Job } from 'bullmq';
import { prisma } from '@hotel-crm/db';
import { createRedisConnection } from '../lib/redis';
import { messageQueue } from '../queues';
import type { AutomationJob, SendMessageJob } from '../queues';

export function createAutomationWorker() {
  const worker = new Worker<AutomationJob>(
    'automations',
    async (job: Job<AutomationJob>) => {
      const { automationId, orgId, guestId, conversationId } = job.data;

      const automation = await prisma.automation.findFirst({
        where: { id: automationId, orgId, isActive: true },
      });

      if (!automation) {
        console.log(`[automation-worker] Automation ${automationId} not found or inactive`);
        return;
      }

      const guest = await prisma.guest.findUnique({
        where: { id: guestId },
      });

      if (!guest) {
        console.log(`[automation-worker] Guest ${guestId} not found`);
        return;
      }

      // Process each action in the automation
      const actions = automation.actions as Array<{
        type: string;
        content?: string;
        delayMinutes?: number;
        templateName?: string;
        templateLanguage?: string;
        assignTo?: string;
        tagName?: string;
      }>;

      for (const action of actions) {
        switch (action.type) {
          case 'send_message': {
            let convoId = conversationId;

            // Find or create a conversation
            if (!convoId) {
              const conversation = await prisma.conversation.findFirst({
                where: { orgId, guestId, status: { in: ['OPEN', 'PENDING'] } },
              });

              if (conversation) {
                convoId = conversation.id;
              } else {
                const newConvo = await prisma.conversation.create({
                  data: { orgId, guestId, status: 'OPEN', lastMessageAt: new Date() },
                });
                convoId = newConvo.id;
              }
            }

            // Personalize content
            const personalizedContent = (action.content || '')
              .replace(/{{guest_name}}/g, guest.name || 'Guest')
              .replace(/{{phone}}/g, guest.phone);

            // Create message record
            const message = await prisma.message.create({
              data: {
                conversationId: convoId,
                direction: 'OUTBOUND',
                type: 'TEXT',
                content: personalizedContent,
                status: 'PENDING',
              },
            });

            // Enqueue send
            const delay = (action.delayMinutes || 0) * 60 * 1000;
            await messageQueue.add(
              'send',
              {
                orgId,
                conversationId: convoId,
                messageId: message.id,
                phone: guest.phone,
                content: personalizedContent,
                type: 'text',
              } satisfies SendMessageJob,
              { delay },
            );

            console.log(
              `[automation-worker] Queued message for guest ${guestId} (delay: ${action.delayMinutes || 0}m)`,
            );
            break;
          }

          case 'assign_agent': {
            if (conversationId && action.assignTo) {
              await prisma.conversation.update({
                where: { id: conversationId },
                data: { assignedAgentId: action.assignTo },
              });
            }
            break;
          }

          case 'add_tag': {
            if (action.tagName) {
              const tag = await prisma.tag.findFirst({
                where: { orgId, name: action.tagName },
              });

              if (tag) {
                await prisma.guestTag.upsert({
                  where: { guestId_tagId: { guestId, tagId: tag.id } },
                  update: {},
                  create: { guestId, tagId: tag.id },
                });
              }
            }
            break;
          }

          case 'update_segment': {
            const segment = action.content as 'NEW' | 'RETURNING' | 'VIP' | 'CORPORATE' | 'GROUP' | 'LONG_STAY' | undefined;
            if (segment) {
              await prisma.guest.update({
                where: { id: guestId },
                data: { segment },
              });
            }
            break;
          }
        }
      }

      // Log automation execution
      await prisma.activityLog.create({
        data: {
          orgId,
          action: 'AUTOMATION_EXECUTED',
          entityType: 'Automation',
          entityId: automationId,
          metadata: {
            automationName: automation.name,
            trigger: automation.trigger,
            guestId,
          },
        },
      });

      console.log(`[automation-worker] Automation "${automation.name}" executed for guest ${guestId}`);
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[automation-worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[automation-worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
