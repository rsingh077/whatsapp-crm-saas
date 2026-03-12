import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

// ─── Queue Definitions ─────────────────────────────────────────────

/** Processes outbound WhatsApp messages (text, media, templates) */
export const messageQueue = new Queue('messages', { connection });

/** Executes campaign broadcasts (schedules individual messages) */
export const campaignQueue = new Queue('campaigns', { connection });

/** Runs automation triggers (welcome msgs, pre-arrival, feedback) */
export const automationQueue = new Queue('automations', { connection });

/** Sends scheduled/reminder messages (booking confirmations, etc.) */
export const scheduledQueue = new Queue('scheduled', { connection });

// ─── Job Type Definitions ───────────────────────────────────────────

export interface SendMessageJob {
  orgId: string;
  conversationId: string;
  messageId: string;
  phone: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'template';
  mediaUrl?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: unknown[];
}

export interface CampaignJob {
  campaignId: string;
  orgId: string;
}

export interface AutomationJob {
  automationId: string;
  orgId: string;
  guestId: string;
  conversationId?: string;
  trigger: string;
}

export interface ScheduledMessageJob {
  orgId: string;
  guestId: string;
  phone: string;
  content: string;
  scheduledFor: string;
}
