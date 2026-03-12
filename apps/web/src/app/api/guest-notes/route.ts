import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { z } from 'zod';

const addNoteSchema = z.object({
  guestId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    // Verify the guest belongs to user's org
    const guest = await prisma.guest.findFirst({
      where: { id: parsed.data.guestId, orgId: session.user.orgId },
    });

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    const note = await prisma.guestNote.create({
      data: {
        guestId: parsed.data.guestId,
        content: parsed.data.content,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Add note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
