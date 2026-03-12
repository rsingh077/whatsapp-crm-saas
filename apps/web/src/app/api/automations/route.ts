import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, Prisma } from '@hotel-crm/db';
import { createAutomationSchema } from '@hotel-crm/shared';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createAutomationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const automation = await prisma.automation.create({
      data: {
        orgId: session.user.orgId,
        name: parsed.data.name,
        trigger: parsed.data.trigger,
        actions: parsed.data.actions as Prisma.InputJsonValue,
        conditions: parsed.data.conditions as Prisma.InputJsonValue | undefined,
        isActive: parsed.data.isActive,
        priority: parsed.data.priority,
      },
    });

    return NextResponse.json({ automation }, { status: 201 });
  } catch (error) {
    console.error('Create automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    const automation = await prisma.automation.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'trigger', 'conditions', 'actions', 'isActive', 'priority'] as const;
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const updated = await prisma.automation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ automation: updated });
  } catch (error) {
    console.error('Update automation error:', error);
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
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 });
    }

    const automation = await prisma.automation.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await prisma.automation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
