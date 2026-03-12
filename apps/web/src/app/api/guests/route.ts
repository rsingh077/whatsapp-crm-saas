import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { createGuestSchema } from '@hotel-crm/shared';

// Get all guests for the org
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guests = await prisma.guest.findMany({
      where: { orgId: session.user.orgId },
      include: {
        _count: { select: { conversations: true, bookings: true } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ guests });
  } catch (error) {
    console.error('Get guests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create a new guest
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createGuestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    // Check if guest with phone already exists
    const existing = await prisma.guest.findUnique({
      where: {
        orgId_phone: { orgId: session.user.orgId, phone: parsed.data.phone },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A guest with this phone number already exists' },
        { status: 409 },
      );
    }

    const guest = await prisma.guest.create({
      data: {
        orgId: session.user.orgId,
        ...parsed.data,
      },
    });

    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error('Create guest error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
