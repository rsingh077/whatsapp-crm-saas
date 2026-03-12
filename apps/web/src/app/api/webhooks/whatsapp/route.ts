import { NextResponse } from 'next/server';
import { prisma } from '@hotel-crm/db';
import { verifyWebhookSignature, parseWebhookPayload } from '@hotel-crm/whatsapp';
import type { WebhookPayload } from '@hotel-crm/whatsapp';

// WhatsApp webhook verification (GET request from Meta)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// WhatsApp webhook handler (POST — incoming messages & status updates)
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature if secret is configured
    if (process.env.WHATSAPP_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(
        rawBody,
        signature,
        process.env.WHATSAPP_WEBHOOK_SECRET,
      );
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody);
    const events = parseWebhookPayload(payload);

    for (const event of events) {
      // Find the organization by WhatsApp phone number ID
      const org = await prisma.organization.findUnique({
        where: { whatsappPhoneNumberId: event.phoneNumberId },
      });

      if (!org) continue;

      // Process incoming messages
      for (const msg of event.messages) {
        // Find or create guest
        const guest = await prisma.guest.upsert({
          where: { orgId_phone: { orgId: org.id, phone: `+${msg.from}` } },
          update: {
            name: msg.contact?.profile.name || undefined,
            lastSeenAt: new Date(),
          },
          create: {
            orgId: org.id,
            phone: `+${msg.from}`,
            name: msg.contact?.profile.name,
            lastSeenAt: new Date(),
          },
        });

        // Find or create conversation
        let conversation = await prisma.conversation.findFirst({
          where: {
            orgId: org.id,
            guestId: guest.id,
            status: { in: ['OPEN', 'PENDING'] },
          },
        });

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              orgId: org.id,
              guestId: guest.id,
              status: 'OPEN',
              lastMessageAt: msg.timestamp,
            },
          });
        }

        // Determine message content based on type
        let content: string | null = null;
        let mediaUrl: string | null = null;
        let mediaMimeType: string | null = null;

        switch (msg.type) {
          case 'text':
            content = msg.message.text?.body ?? null;
            break;
          case 'image':
            content = msg.message.image?.caption ?? null;
            mediaMimeType = msg.message.image?.mime_type ?? null;
            break;
          case 'document':
            content = msg.message.document?.caption ?? msg.message.document?.filename ?? null;
            mediaMimeType = msg.message.document?.mime_type ?? null;
            break;
          case 'location':
            content = msg.message.location
              ? `📍 Location: ${msg.message.location.name || ''} (${msg.message.location.latitude}, ${msg.message.location.longitude})`
              : null;
            break;
          case 'reaction':
            content = msg.message.reaction?.emoji ?? null;
            break;
          default:
            content = `[${msg.type} message]`;
        }

        // Save message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            direction: 'INBOUND',
            type: msg.type.toUpperCase() as 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'REACTION' | 'STICKER',
            content,
            mediaUrl,
            mediaMimeType,
            whatsappMessageId: msg.messageId,
            status: 'DELIVERED',
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: msg.timestamp, status: 'OPEN' },
        });
      }

      // Process status updates
      for (const status of event.statuses) {
        const statusMap: Record<string, string> = {
          sent: 'SENT',
          delivered: 'DELIVERED',
          read: 'READ',
          failed: 'FAILED',
        };

        await prisma.message.updateMany({
          where: { whatsappMessageId: status.messageId },
          data: { status: statusMap[status.status] as 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' },
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
