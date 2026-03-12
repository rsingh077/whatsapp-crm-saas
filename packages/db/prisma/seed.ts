import { PrismaClient, Plan, Role, GuestSegment, ConversationStatus, Priority, BookingStatus } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Create demo hotel organization
  const hotel = await prisma.organization.upsert({
    where: { slug: 'grand-palace-hotel' },
    update: {},
    create: {
      name: 'Grand Palace Hotel',
      slug: 'grand-palace-hotel',
      email: 'info@grandpalace.com',
      phone: '+911234567890',
      address: '123 Luxury Ave, Mumbai, India',
      timezone: 'Asia/Kolkata',
      plan: Plan.PROFESSIONAL,
    },
  });
  console.log(`✅ Organization: ${hotel.name}`);

  // Create demo users
  const owner = await prisma.user.upsert({
    where: { email: 'owner@grandpalace.com' },
    update: {},
    create: {
      email: 'owner@grandpalace.com',
      name: 'Rajveer Singh',
      passwordHash: hashPassword('demo-password-123'),
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agent@grandpalace.com' },
    update: {},
    create: {
      email: 'agent@grandpalace.com',
      name: 'Priya Sharma',
      passwordHash: hashPassword('demo-password-123'),
    },
  });
  console.log(`✅ Users: ${owner.name}, ${agent.name}`);

  // Add members to organization
  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: owner.id, orgId: hotel.id } },
    update: {},
    create: { userId: owner.id, orgId: hotel.id, role: Role.OWNER },
  });

  await prisma.orgMember.upsert({
    where: { userId_orgId: { userId: agent.id, orgId: hotel.id } },
    update: {},
    create: { userId: agent.id, orgId: hotel.id, role: Role.AGENT },
  });
  console.log('✅ Team members assigned');

  // Create tags
  const tags = await Promise.all(
    [
      { name: 'Booking Inquiry', color: '#3b82f6' },
      { name: 'Complaint', color: '#ef4444' },
      { name: 'Room Service', color: '#f59e0b' },
      { name: 'VIP Guest', color: '#8b5cf6' },
      { name: 'Feedback', color: '#10b981' },
      { name: 'Check-in', color: '#06b6d4' },
      { name: 'Check-out', color: '#6366f1' },
    ].map((tag) =>
      prisma.tag.upsert({
        where: { orgId_name: { orgId: hotel.id, name: tag.name } },
        update: {},
        create: { orgId: hotel.id, ...tag },
      }),
    ),
  );
  console.log(`✅ Tags: ${tags.length} created`);

  // Create canned replies
  const replies = await Promise.all(
    [
      {
        title: 'Welcome Message',
        shortcut: '/welcome',
        content:
          'Hello! 🙏 Welcome to Grand Palace Hotel. How may I assist you today? Whether you need help with bookings, room service, or any queries, I\'m here to help!',
        category: 'General',
      },
      {
        title: 'Check-in Info',
        shortcut: '/checkin',
        content:
          'Check-in time is 2:00 PM. Please bring a valid photo ID. Early check-in is subject to availability. Would you like me to arrange anything special for your arrival?',
        category: 'Operations',
      },
      {
        title: 'Room Service Menu',
        shortcut: '/menu',
        content:
          'Our room service is available 24/7! I can share our menu with you. What would you prefer — breakfast, lunch, dinner, or snacks?',
        category: 'Services',
      },
      {
        title: 'Thank You',
        shortcut: '/thanks',
        content:
          'Thank you for choosing Grand Palace Hotel! We hope you had a wonderful stay. We\'d love to hear your feedback. 🌟',
        category: 'General',
      },
      {
        title: 'Wi-Fi Info',
        shortcut: '/wifi',
        content:
          'Our Wi-Fi network is "GrandPalace-Guest". The password is available at the front desk or in your room keycard holder. Enjoy complimentary high-speed internet!',
        category: 'Services',
      },
    ].map((reply) =>
      prisma.cannedReply.upsert({
        where: { orgId_shortcut: { orgId: hotel.id, shortcut: reply.shortcut } },
        update: {},
        create: { orgId: hotel.id, ...reply },
      }),
    ),
  );
  console.log(`✅ Canned replies: ${replies.length} created`);

  // Create sample guests
  const guest1 = await prisma.guest.upsert({
    where: { orgId_phone: { orgId: hotel.id, phone: '+919876543210' } },
    update: {},
    create: {
      orgId: hotel.id,
      phone: '+919876543210',
      name: 'Amit Patel',
      email: 'amit.patel@email.com',
      segment: GuestSegment.RETURNING,
    },
  });

  const guest2 = await prisma.guest.upsert({
    where: { orgId_phone: { orgId: hotel.id, phone: '+919876543211' } },
    update: {},
    create: {
      orgId: hotel.id,
      phone: '+919876543211',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      segment: GuestSegment.VIP,
      vip: true,
    },
  });

  const guest3 = await prisma.guest.upsert({
    where: { orgId_phone: { orgId: hotel.id, phone: '+919876543212' } },
    update: {},
    create: {
      orgId: hotel.id,
      phone: '+919876543212',
      name: 'Michael Chen',
      segment: GuestSegment.NEW,
    },
  });
  console.log(`✅ Guests: ${guest1.name}, ${guest2.name}, ${guest3.name}`);

  // Create sample bookings
  const now = new Date();
  await prisma.booking.createMany({
    data: [
      {
        orgId: hotel.id,
        guestId: guest1.id,
        roomType: 'Deluxe Suite',
        roomNumber: '301',
        checkIn: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        checkOut: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        adults: 2,
        status: BookingStatus.CONFIRMED,
        totalAmount: 25000,
        currency: 'INR',
      },
      {
        orgId: hotel.id,
        guestId: guest2.id,
        roomType: 'Presidential Suite',
        roomNumber: '501',
        checkIn: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        checkOut: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        adults: 2,
        children: 1,
        status: BookingStatus.CHECKED_IN,
        totalAmount: 75000,
        currency: 'INR',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample bookings created');

  // Create sample conversations with messages
  const conv1 = await prisma.conversation.create({
    data: {
      orgId: hotel.id,
      guestId: guest1.id,
      assignedAgentId: agent.id,
      status: ConversationStatus.OPEN,
      priority: Priority.MEDIUM,
      lastMessageAt: new Date(),
      messages: {
        createMany: {
          data: [
            {
              direction: 'INBOUND',
              type: 'TEXT',
              content: 'Hi, I have a booking for March 14th. Can I get an early check-in?',
              status: 'READ',
              createdAt: new Date(now.getTime() - 60 * 60 * 1000),
            },
            {
              direction: 'OUTBOUND',
              senderId: agent.id,
              type: 'TEXT',
              content: 'Hello Amit! Welcome back! 🙏 Let me check the availability for early check-in on March 14th. One moment please.',
              status: 'DELIVERED',
              createdAt: new Date(now.getTime() - 55 * 60 * 1000),
            },
            {
              direction: 'OUTBOUND',
              senderId: agent.id,
              type: 'TEXT',
              content: 'Great news! We can arrange early check-in at 11:00 AM for your Deluxe Suite (Room 301). Is that suitable?',
              status: 'DELIVERED',
              createdAt: new Date(now.getTime() - 50 * 60 * 1000),
            },
            {
              direction: 'INBOUND',
              type: 'TEXT',
              content: 'That would be perfect! Thank you so much. Also, could you arrange airport pickup?',
              status: 'READ',
              createdAt: new Date(now.getTime() - 30 * 60 * 1000),
            },
          ],
        },
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      orgId: hotel.id,
      guestId: guest2.id,
      assignedAgentId: agent.id,
      status: ConversationStatus.OPEN,
      priority: Priority.HIGH,
      lastMessageAt: new Date(),
      messages: {
        createMany: {
          data: [
            {
              direction: 'INBOUND',
              type: 'TEXT',
              content: 'The AC in our room seems to not be cooling properly. Could someone look at it?',
              status: 'READ',
              createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
            },
            {
              direction: 'OUTBOUND',
              senderId: agent.id,
              type: 'TEXT',
              content: 'I sincerely apologize for the inconvenience, Mrs. Johnson. I\'m sending our maintenance team to Room 501 right away. In the meantime, would you like us to arrange a portable fan?',
              status: 'READ',
              createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
            },
            {
              direction: 'INBOUND',
              type: 'TEXT',
              content: 'Yes please, that would be helpful. Also can I order room service?',
              status: 'DELIVERED',
              createdAt: new Date(now.getTime() - 15 * 60 * 1000),
            },
          ],
        },
      },
    },
  });

  const conv3 = await prisma.conversation.create({
    data: {
      orgId: hotel.id,
      guestId: guest3.id,
      status: ConversationStatus.OPEN,
      priority: Priority.MEDIUM,
      lastMessageAt: new Date(),
      messages: {
        createMany: {
          data: [
            {
              direction: 'INBOUND',
              type: 'TEXT',
              content: 'Hello! I\'d like to know the room rates for next weekend. Do you have any suites available?',
              status: 'DELIVERED',
              createdAt: new Date(now.getTime() - 5 * 60 * 1000),
            },
          ],
        },
      },
    },
  });
  console.log(`✅ Conversations: ${[conv1, conv2, conv3].length} with messages`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
