import { NextResponse } from 'next/server';
import { prisma } from '@hotel-crm/db';

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      service: 'hotel-crm-web',
      environment: process.env.NODE_ENV ?? 'development',
      database: 'up',
      redisConfigured: Boolean(process.env.REDIS_URL),
      whatsappConfigured: Boolean(
        process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN,
      ),
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        ok: false,
        service: 'hotel-crm-web',
        environment: process.env.NODE_ENV ?? 'development',
        database: 'down',
        redisConfigured: Boolean(process.env.REDIS_URL),
        whatsappConfigured: Boolean(
          process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN,
        ),
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}