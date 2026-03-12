# WhatsApp CRM SaaS

A WhatsApp-based CRM SaaS dashboard built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase** for managing customer conversations, leads, contacts, and tasks.

![Dashboard](https://github.com/user-attachments/assets/8d21bf5c-1f66-4823-a61e-0e9d0f782512)

## Features

- 📊 **Dashboard** — Overview of contacts, pipeline value, pending tasks, and active chats with stage-by-stage pipeline visualization
- 👥 **Contacts** — Full CRUD for contacts with search, status badges, and modal forms
- 🎯 **Leads** — Kanban pipeline board (New → Qualified → Proposal → Negotiation → Won/Lost) with list view toggle and quick status transitions
- ✅ **Tasks** — Task list with priority/status filters, overdue highlighting, and one-click status cycling
- 💬 **Conversations** — WhatsApp-style chat interface per contact with inbound/outbound message threading, archive support

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| ORM | Supabase JS client |

## Getting Started

### 1. Clone & install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL Editor to create all tables and seed sample data
3. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Schema

| Table | Description |
|---|---|
| `contacts` | CRM contacts with name, phone, email, company, status |
| `leads` | Sales leads linked to contacts with pipeline status and value |
| `tasks` | Action items with priority, due date, and status |
| `conversations` | WhatsApp conversations per contact |
| `messages` | Individual messages within a conversation (inbound/outbound) |

See [`supabase/schema.sql`](./supabase/schema.sql) for the full schema with RLS policies and sample data.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── contacts/page.tsx           # Contacts CRUD
│   ├── leads/page.tsx              # Leads pipeline
│   ├── tasks/page.tsx              # Tasks management
│   ├── conversations/
│   │   ├── page.tsx                # Conversations list
│   │   └── [id]/page.tsx           # Chat view
│   ├── layout.tsx                  # Root layout with sidebar
│   └── globals.css
├── components/
│   ├── Sidebar.tsx                 # Navigation sidebar
│   ├── StatCard.tsx                # Dashboard metric card
│   └── Badge.tsx                  # Status/priority badge
├── lib/
│   └── supabase.ts                 # Supabase client
└── types/
    └── index.ts                    # Shared TypeScript types
supabase/
└── schema.sql                      # Database schema & seed data
```
