import { prisma } from '@hotel-crm/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const [campaigns, templates, guests] = await Promise.all([
    prisma.campaign.findMany({
      where: { orgId: session.user.orgId },
      include: {
        template: { select: { name: true, body: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.messageTemplate.findMany({
      where: { orgId: session.user.orgId },
      select: { id: true, name: true, body: true },
      orderBy: { name: 'asc' },
    }),
    prisma.guest.findMany({
      where: { orgId: session.user.orgId },
      select: { id: true, name: true, phone: true, segment: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <CampaignsClient
      campaigns={JSON.parse(JSON.stringify(campaigns))}
      templates={templates}
      guests={guests}
    />
  );
}
