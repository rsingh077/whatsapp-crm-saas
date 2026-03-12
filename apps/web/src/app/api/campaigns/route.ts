import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { createCampaignSchema } from '@hotel-crm/shared';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, templateId, scheduledAt, recipientIds } = parsed.data;

    // Verify template belongs to org
    const template = await prisma.messageTemplate.findFirst({
      where: { id: templateId, orgId: session.user.orgId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Verify all recipients belong to org
    const guests = await prisma.guest.findMany({
      where: { id: { in: recipientIds }, orgId: session.user.orgId },
      select: { id: true },
    });

    if (guests.length !== recipientIds.length) {
      return NextResponse.json({ error: 'Some guests not found' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        orgId: session.user.orgId,
        name,
        templateId,
        scheduledAt,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
        recipients: {
          create: recipientIds.map((guestId) => ({ guestId })),
        },
      },
      include: {
        template: { select: { name: true, body: true } },
        _count: { select: { recipients: true } },
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'SENDING') {
      return NextResponse.json({ error: 'Cannot delete a campaign that is currently sending' }, { status: 400 });
    }

    await prisma.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
