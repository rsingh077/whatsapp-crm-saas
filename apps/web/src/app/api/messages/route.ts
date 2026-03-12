import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { sendMessageSchema } from '@hotel-crm/shared';
import { WhatsAppClient } from '@hotel-crm/whatsapp';

// Send a message in a conversation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { conversationId, content, type } = parsed.data;

    // Verify conversation belongs to the user's org
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: session.user.orgId },
      include: {
        guest: true,
        org: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save message to database
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        direction: 'OUTBOUND',
        type,
        content,
        status: 'PENDING',
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        assignedAgentId: conversation.assignedAgentId || session.user.id,
      },
    });

    // Send via WhatsApp API if configured
    if (
      conversation.org.whatsappPhoneNumberId &&
      conversation.org.whatsappAccessToken
    ) {
      try {
        const whatsapp = new WhatsAppClient({
          phoneNumberId: conversation.org.whatsappPhoneNumberId,
          accessToken: conversation.org.whatsappAccessToken,
          businessId: conversation.org.whatsappBusinessId || '',
          webhookSecret: conversation.org.webhookSecret || '',
        });

        const result = await whatsapp.sendText(conversation.guest.phone, content);

        // Update message with WhatsApp ID and status
        await prisma.message.update({
          where: { id: message.id },
          data: {
            whatsappMessageId: result.messages[0]?.id,
            status: 'SENT',
          },
        });
      } catch (error) {
        console.error('WhatsApp send error:', error);
        await prisma.message.update({
          where: { id: message.id },
          data: { status: 'FAILED' },
        });
      }
    } else {
      // No WhatsApp configured, mark as sent (dev mode)
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'SENT' },
      });
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get messages for a conversation
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    // Verify conversation belongs to user's org
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, orgId: session.user.orgId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
