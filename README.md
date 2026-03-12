<div align="center">

# 🏨 Hotel CRM — WhatsApp Business Platform

**A multi-tenant WhatsApp CRM SaaS purpose-built for hotels and hospitality businesses.**

Manage guest conversations, automate pre-arrival workflows, send campaigns, and deliver 5-star service — all from WhatsApp.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

| Category | What's Included |
|----------|----------------|
| **Shared Inbox** | Real-time WhatsApp conversations, agent assignment, canned replies, conversation tags |
| **Guest CRM** | Guest profiles, segments (VIP, Corporate, Group), notes, booking history, tags |
| **Campaigns** | Bulk WhatsApp template broadcasts, recipient targeting by segment, delivery tracking |
| **Automation** | Trigger-based workflows — welcome messages, pre-arrival info, checkout feedback, FAQ auto-reply |
| **Analytics** | Conversation stats, guest metrics, booking overview, message volume |
| **Multi-tenant** | Each hotel gets its own workspace with isolated data, team roles (Owner/Admin/Agent) |
| **Authentication** | Email/password + Google OAuth, JWT sessions, role-based access |

---

## 🏗️ Architecture

```
whatsapp-crm-saas/
├── apps/
│   ├── web/          → Next.js 15 dashboard (App Router, RSC, Tailwind, shadcn/ui)
│   └── worker/       → BullMQ background workers (messages, campaigns, automations)
├── packages/
│   ├── db/           → Prisma ORM + PostgreSQL schema + seed data
│   ├── shared/       → Zod validators, constants, shared types
│   ├── whatsapp/     → WhatsApp Cloud API client + webhook processing
│   └── tsconfig/     → Shared TypeScript configurations
├── docker-compose.yml
└── turbo.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui, Radix UI |
| Backend | Next.js API Routes, NextAuth.js |
| Database | PostgreSQL 16, Prisma ORM 6 |
| Queue | BullMQ + Redis 7 |
| WhatsApp | Meta Cloud API (Business Platform) |
| Monorepo | Turborepo + pnpm workspaces |
| Language | TypeScript (strict mode) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 9 (`npm install -g pnpm`)
- **Docker** & Docker Compose (for PostgreSQL + Redis)

### 1. Clone & Install

```bash
git clone https://github.com/rsingh077/whatsapp-crm-saas.git
cd whatsapp-crm-saas
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `DATABASE_URL` — already configured for Docker defaults
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- WhatsApp API credentials (optional for local dev)

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL and Redis.

### 4. Initialize Database

```bash
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed with demo hotel data
```

### 5. Run Development

```bash
pnpm dev          # Starts web app + worker concurrently
```

- **Web App**: http://localhost:3000
- **Prisma Studio**: `pnpm db:studio`

### Demo Credentials

After seeding, login with:
- **Email**: `owner@grandpalace.com`
- **Password**: `password123`

---

## ▲ Deploy To Vercel

### Recommended Production Setup

- **Frontend / API**: Vercel
- **Database**: Neon PostgreSQL
- **Queue / Redis**: Upstash Redis
- **Worker**: Railway, Render, Fly.io, or a VPS running `apps/worker`

### Vercel Project Settings

When creating the Vercel project:

1. Import this repository
2. Set **Root Directory** to `apps/web`
3. Keep the framework as **Next.js**
4. The repo already includes [apps/web/vercel.json](apps/web/vercel.json) with monorepo install/build commands

### Required Environment Variables

Add these in the Vercel dashboard:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `REDIS_URL` (optional for web, required for worker)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google login)
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_WEBHOOK_SECRET`

### Production Checklist

```bash
pnpm install
pnpm build
```

After deployment:

1. Run `pnpm db:push` against your production database
2. Open `https://your-domain.com/api/health` to verify the app and database are reachable
3. Set your Meta webhook URL to `https://your-domain.com/api/webhooks/whatsapp`
4. Deploy the worker separately with the same `.env` values plus `REDIS_URL`

### Notes

- Vercel hosts the web app and API routes, but **not** long-running BullMQ workers
- Campaign sending and background automation require `apps/worker` to be deployed separately
- The built-in health endpoint is available at `/api/health`

---

## 📁 Project Structure

### Database Schema

The multi-tenant schema supports full CRM operations:

- **Organization** — Hotel/tenant with WhatsApp config and billing plan
- **User / OrgMember** — Team members with Owner/Admin/Agent roles
- **Guest** — WhatsApp contacts with segments, tags, and notes
- **Conversation / Message** — Full chat history with status tracking
- **Booking** — Room reservations linked to guests
- **Campaign / CampaignRecipient** — Broadcast campaigns with delivery tracking
- **Automation** — Trigger-based workflows with configurable actions
- **CannedReply** — Quick response templates with shortcuts
- **Tag** — Flexible labeling for conversations and guests

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/guests` | List/create guests |
| GET/PATCH/DELETE | `/api/guests/[id]` | Guest CRUD operations |
| POST | `/api/guest-notes` | Add note to a guest |
| GET | `/api/conversations` | List conversations |
| PATCH | `/api/conversations/[id]` | Update status, assign agent |
| GET/POST | `/api/messages` | Get/send messages |
| GET/POST | `/api/tags` | Manage tags |
| GET/POST | `/api/canned-replies` | Manage quick replies |
| GET/PATCH | `/api/organization` | Org settings (owner-only update) |
| GET/POST | `/api/webhooks/whatsapp` | WhatsApp webhook handler |

### Background Workers

The worker service processes:
- **Message Worker** — Sends outbound WhatsApp messages (rate-limited to 80/s)
- **Campaign Worker** — Orchestrates broadcast sends to recipient lists
- **Automation Worker** — Executes trigger-based actions (send message, assign agent, add tag)

---

## 🔧 WhatsApp Setup

1. Create a [Meta Developer App](https://developers.facebook.com/)
2. Enable **WhatsApp Business** product
3. Get your **Phone Number ID** and **Access Token**
4. Configure webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
5. Set webhook **Verify Token** to match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in your `.env`
6. Subscribe to webhook fields: `messages`

> The app works in **demo mode** without WhatsApp credentials — messages are stored locally but not delivered.

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm db:push` | Push Prisma schema to database |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Prisma Studio GUI |
| `pnpm db:generate` | Regenerate Prisma Client |

---

## 🗺️ Roadmap

- [ ] Real-time updates with WebSockets
- [ ] File/media message support (images, documents)
- [ ] WhatsApp template message builder
- [ ] Guest import/export (CSV)
- [ ] Booking system integration (PMS)
- [ ] Multi-language support
- [ ] Mobile responsive inbox
- [ ] Stripe billing integration
- [ ] Rate limiting & API keys
- [ ] E2E test suite (Playwright)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for the hospitality industry</sub>
</div>
