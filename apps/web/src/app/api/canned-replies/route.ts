import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';

// GET: List canned replies for the org
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cannedReplies = await prisma.cannedReply.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ cannedReplies });
  } catch (error) {
    console.error('Get canned replies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a canned reply
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, shortcut } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 },
      );
    }

    const cannedReply = await prisma.cannedReply.create({
      data: {
        orgId: session.user.orgId,
        title,
        content,
        shortcut: shortcut || null,
      },
    });

    return NextResponse.json({ cannedReply }, { status: 201 });
  } catch (error) {
    console.error('Create canned reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
