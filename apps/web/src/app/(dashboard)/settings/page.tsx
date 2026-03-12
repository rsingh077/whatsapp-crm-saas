import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@hotel-crm/db';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const org = await prisma.organization.findUnique({
    where: { id: session.user.orgId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        where: { isActive: true },
      },
    },
  });

  if (!org) redirect('/login');

  return <SettingsClient org={JSON.parse(JSON.stringify(org))} />;
}
