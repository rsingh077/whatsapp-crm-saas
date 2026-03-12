export const APP_NAME = 'HotelCRM';
export const APP_DESCRIPTION = 'WhatsApp CRM for Hotels';

export const PLANS = {
  FREE: {
    name: 'Free',
    maxAgents: 2,
    maxGuests: 100,
    maxMessagesPerMonth: 500,
    features: ['Basic inbox', 'Guest profiles', '5 canned replies'],
  },
  STARTER: {
    name: 'Starter',
    maxAgents: 5,
    maxGuests: 1000,
    maxMessagesPerMonth: 5000,
    features: ['Everything in Free', 'Tags & labels', '25 canned replies', 'Basic automation'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    maxAgents: 15,
    maxGuests: 10000,
    maxMessagesPerMonth: 25000,
    features: [
      'Everything in Starter',
      'Unlimited canned replies',
      'Advanced automation',
      'Campaigns & broadcasts',
      'Analytics dashboard',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    maxAgents: -1,
    maxGuests: -1,
    maxMessagesPerMonth: -1,
    features: [
      'Everything in Professional',
      'Unlimited everything',
      'API access',
      'Custom integrations',
      'Priority support',
      'Dedicated account manager',
    ],
  },
} as const;

export const CONVERSATION_STATUS_LABELS = {
  OPEN: 'Open',
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
} as const;

export const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

export const GUEST_SEGMENT_LABELS = {
  NEW: 'New Guest',
  RETURNING: 'Returning',
  VIP: 'VIP',
  INACTIVE: 'Inactive',
} as const;
