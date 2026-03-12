import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  hotelName: z.string().min(2, 'Hotel name must be at least 2 characters'),
});

// ─── Guest Schemas ──────────────────────────────────────────────────────────

export const createGuestSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number (use E.164 format)'),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  segment: z.enum(['NEW', 'RETURNING', 'VIP', 'INACTIVE']).optional(),
  vip: z.boolean().optional(),
});

export const updateGuestSchema = createGuestSchema.partial();

// ─── Message Schemas ────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1, 'Message cannot be empty').max(4096),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'TEMPLATE']).default('TEXT'),
  mediaUrl: z.string().url().optional(),
});

// ─── Booking Schemas ────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  guestId: z.string().cuid(),
  roomType: z.string().optional(),
  roomNumber: z.string().optional(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().min(0).default(0),
  totalAmount: z.number().positive().optional(),
  currency: z.string().length(3).default('INR'),
  notes: z.string().optional(),
}).refine((data) => data.checkOut > data.checkIn, {
  message: 'Check-out must be after check-in',
  path: ['checkOut'],
});

// ─── Organization Schemas ───────────────────────────────────────────────────

export const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  timezone: z.string().optional(),
  website: z.string().url().optional(),
  whatsappPhoneNumberId: z.string().optional(),
  whatsappAccessToken: z.string().optional(),
  whatsappBusinessId: z.string().optional(),
  webhookSecret: z.string().optional(),
});

// ─── Campaign Schemas ───────────────────────────────────────────────────────

export const createCampaignSchema = z.object({
  name: z.string().min(2),
  templateId: z.string().cuid(),
  scheduledAt: z.coerce.date().optional(),
  recipientIds: z.array(z.string().cuid()).min(1),
});

// ─── Automation Schemas ─────────────────────────────────────────────────────

export const createAutomationSchema = z.object({
  name: z.string().min(2),
  trigger: z.enum([
    'MESSAGE_RECEIVED',
    'CONVERSATION_OPENED',
    'CONVERSATION_CLOSED',
    'BOOKING_CREATED',
    'BOOKING_CHECKIN',
    'BOOKING_CHECKOUT',
    'GUEST_CREATED',
    'SCHEDULED',
  ]),
  conditions: z.record(z.unknown()).optional(),
  actions: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  priority: z.number().int().default(0),
});

// ─── Types ──────────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
