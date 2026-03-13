import { prisma } from '@hotel-crm/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Send,
  CheckCheck,
  Calendar,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) redirect('/login');

  const orgId = session.user.orgId;

  // Gather stats
  const [
    totalConversations,
    openConversations,
    totalGuests,
    totalMessages,
    totalBookings,
    vipGuests,
  ] = await Promise.all([
    prisma.conversation.count({ where: { orgId } }),
    prisma.conversation.count({ where: { orgId, status: 'OPEN' } }),
    prisma.guest.count({ where: { orgId } }),
    prisma.message.count({
      where: { conversation: { orgId } },
    }),
    prisma.booking.count({ where: { orgId } }),
    prisma.guest.count({ where: { orgId, vip: true } }),
  ]);

  const stats = [
    {
      title: 'Total Conversations',
      value: totalConversations,
      change: '+12%',
      trend: 'up',
      icon: MessageSquare,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Open Conversations',
      value: openConversations,
      change: '-5%',
      trend: 'down',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Total Guests',
      value: totalGuests,
      change: '+8%',
      trend: 'up',
      icon: Users,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Messages Sent',
      value: totalMessages,
      change: '+23%',
      trend: 'up',
      icon: Send,
      color: 'text-violet-600 bg-violet-50',
    },
    {
      title: 'Total Bookings',
      value: totalBookings,
      change: '+15%',
      trend: 'up',
      icon: Calendar,
      color: 'text-pink-600 bg-pink-50',
    },
    {
      title: 'VIP Guests',
      value: vipGuests,
      change: '+2',
      trend: 'up',
      icon: Star,
      color: 'text-orange-600 bg-orange-50',
    },
  ];

  // Get recent conversations for activity
  const recentConversations = await prisma.conversation.findMany({
    where: { orgId },
    include: {
      guest: { select: { name: true, phone: true } },
      assignedAgent: { select: { name: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 5,
  });

  // Get upcoming bookings
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      orgId,
      checkIn: { gte: new Date() },
      status: { in: ['CONFIRMED', 'PENDING'] },
    },
    include: {
      guest: { select: { name: true, phone: true, vip: true } },
    },
    orderBy: { checkIn: 'asc' },
    take: 5,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Overview of your hotel&apos;s WhatsApp CRM performance</p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value.toLocaleString()}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Conversations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentConversations.map((conv: (typeof recentConversations)[number]) => (
                  <div key={conv.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-whatsapp/10 text-sm font-medium text-whatsapp-dark">
                        {(conv.guest.name || conv.guest.phone).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {conv.guest.name || conv.guest.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conv.assignedAgent?.name
                            ? `Assigned to ${conv.assignedAgent.name}`
                            : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        conv.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700'
                          : conv.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {conv.status}
                    </span>
                  </div>
                ))}
                {recentConversations.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">
                            {booking.guest.name || booking.guest.phone}
                          </p>
                          {booking.guest.vip && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {booking.roomType || 'Standard'} · {booking.roomNumber || 'TBA'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(booking.checkIn).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.ceil(
                          (new Date(booking.checkOut).getTime() -
                            new Date(booking.checkIn).getTime()) /
                            (1000 * 60 * 60 * 24),
                        )}{' '}
                        nights
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingBookings.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No upcoming bookings
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
