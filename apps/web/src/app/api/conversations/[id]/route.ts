import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';

// PATCH: Update conversation (assign agent, change status, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify conversation belongs to user's org
    const conversation = await prisma.conversation.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const allowedFields = ['status', 'priority', 'assignedAgentId'] as const;
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: updateData,
      include: {
        guest: true,
        assignedAgent: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ conversation: updated });
  } catch (error) {
    console.error('Update conversation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
