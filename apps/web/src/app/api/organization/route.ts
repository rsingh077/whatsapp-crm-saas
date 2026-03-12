import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@hotel-crm/db';
import { updateOrgSchema } from '@hotel-crm/shared';

// GET: Fetch org settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Get org error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update org settings (OWNER only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is OWNER
    const membership = await prisma.orgMember.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: session.user.orgId,
        },
      },
    });

    if (membership?.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can update organization settings' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateOrgSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const org = await prisma.organization.update({
      where: { id: session.user.orgId },
      data: parsed.data,
    });

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Update org error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
