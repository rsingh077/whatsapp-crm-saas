import { prisma } from '@hotel-crm/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AutomationClient } from './automation-client';

export default async function AutomationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const automations = await prisma.automation.findMany({
    where: { orgId: session.user.orgId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
  });

  return <AutomationClient automations={JSON.parse(JSON.stringify(automations))} />;
}
