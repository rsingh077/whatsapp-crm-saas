import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { updateGuestSchema } from '@hotel-crm/shared';

// GET: Fetch a single guest by ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const guest = await prisma.guest.findFirst({
      where: { id, orgId: session.user.orgId },
      include: {
        tags: { include: { tag: true } },
        notes: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        conversations: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { lastMessageAt: 'desc' },
        },
        bookings: { orderBy: { checkIn: 'desc' } },
        _count: { select: { conversations: true, bookings: true } },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    return NextResponse.json({ guest });
  } catch (error) {
    console.error('Get guest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update a guest
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
    const parsed = updateGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    // Verify guest belongs to user's org
    const existing = await prisma.guest.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    const guest = await prisma.guest.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ guest });
  } catch (error) {
    console.error('Update guest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete a guest
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.guest.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    await prisma.guest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete guest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
