import { NextResponse } from 'next/server';
import { prisma } from '@hotel-crm/db';
import { signupSchema } from '@hotel-crm/shared';
import { randomBytes, scryptSync } from 'crypto';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 },
      );
    }

    const { name, email, password, hotelName } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 },
      );
    }

    // Create user, organization, and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashPassword(password),
        },
      });

      // Generate unique slug
      let slug = slugify(hotelName);
      const existingOrg = await tx.organization.findUnique({ where: { slug } });
      if (existingOrg) {
        slug = `${slug}-${randomBytes(3).toString('hex')}`;
      }

      const org = await tx.organization.create({
        data: {
          name: hotelName,
          slug,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Create default tags
      await tx.tag.createMany({
        data: [
          { orgId: org.id, name: 'Booking Inquiry', color: '#3b82f6' },
          { orgId: org.id, name: 'Complaint', color: '#ef4444' },
          { orgId: org.id, name: 'Room Service', color: '#f59e0b' },
          { orgId: org.id, name: 'VIP Guest', color: '#8b5cf6' },
          { orgId: org.id, name: 'Feedback', color: '#10b981' },
        ],
      });

      return { user, org };
    });

    return NextResponse.json(
      { message: 'Account created successfully', orgSlug: result.org.slug },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
