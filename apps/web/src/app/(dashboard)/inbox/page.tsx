import { prisma } from '@hotel-crm/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InboxClient } from './inbox-client';

export default async function InboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const conversations = await prisma.conversation.findMany({
    where: { orgId: session.user.orgId },
    include: {
      guest: true,
      assignedAgent: {
        select: { id: true, name: true, image: true },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      tags: {
        include: { tag: true },
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  });

  return <InboxClient conversations={conversations} currentUserId={session.user.id} />;
}
