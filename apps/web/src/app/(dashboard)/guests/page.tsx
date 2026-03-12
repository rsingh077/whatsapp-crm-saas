import { prisma } from '@hotel-crm/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { GuestsClient } from './guests-client';

export default async function GuestsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const guests = await prisma.guest.findMany({
    where: { orgId: session.user.orgId },
    include: {
      _count: {
        select: { conversations: true, bookings: true },
      },
      bookings: {
        orderBy: { checkIn: 'desc' },
        take: 1,
      },
      tags: {
        include: { tag: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: guests.length,
    vip: guests.filter((g) => g.vip).length,
    new: guests.filter((g) => g.segment === 'NEW').length,
    returning: guests.filter((g) => g.segment === 'RETURNING').length,
  };

  return <GuestsClient guests={guests} stats={stats} />;
}
