import { createHmac } from 'crypto';
import type { WebhookPayload, WebhookMessage, WebhookStatus, WebhookContact } from './types';

/** Verify the webhook signature from Meta */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature =
    'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');

  // Constant-time comparison
  if (expectedSignature.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

export interface ParsedWebhookEvent {
  phoneNumberId: string;
  messages: Array<{
    from: string;
    messageId: string;
    timestamp: Date;
    type: string;
    contact?: WebhookContact;
    message: WebhookMessage;
  }>;
  statuses: Array<{
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: Date;
    recipientId: string;
    errors?: Array<{ code: number; title: string }>;
  }>;
}

/** Parse webhook payload into a structured event */
export function parseWebhookPayload(payload: WebhookPayload): ParsedWebhookEvent[] {
  const events: ParsedWebhookEvent[] = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') continue;

      const value = change.value;
      const phoneNumberId = value.metadata.phone_number_id;

      const messages = (value.messages ?? []).map((msg) => ({
        from: msg.from,
        messageId: msg.id,
        timestamp: new Date(parseInt(msg.timestamp) * 1000),
        type: msg.type,
        contact: value.contacts?.find((c) => c.wa_id === msg.from),
        message: msg,
      }));

      const statuses = (value.statuses ?? []).map((status) => ({
        messageId: status.id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000),
        recipientId: status.recipient_id,
        errors: status.errors,
      }));

      events.push({ phoneNumberId, messages, statuses });
    }
  }

  return events;
}
