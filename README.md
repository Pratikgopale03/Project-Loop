# Project LOOP — AI Customer-Feedback Intelligence Platform

Project LOOP is a production-grade AI Customer-Feedback Intelligence platform. It ingests multi-channel customer feedback (emails, support tickets, reviews, NPS, sales notes, tweets), automatically classifies sentiment and clusters feedback into themes using Anthropic Claude, generates local semantic vector embeddings, and enables grounded Q&A (RAG) and Voice-of-Customer report summaries.

This platform is structured for a graded internship submission, prioritizing a fully working, secure, and demoable multi-tenant SaaS application.

---

## ═══════════════════════════════════════
## TECH STACK & ARCHITECTURE
## ═══════════════════════════════════════

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Lucide React Icons
- **Database & ORM**: PostgreSQL (Supabase or Neon) + Prisma ORM (v5)
- **Authentication**: NextAuth (Auth.js) Credentials Flow + BCrypt Hashing
- **AI Engine**: Anthropic Claude API (claude-3-5-sonnet-20240620, server-side only)
- **Local Embeddings**: `@huggingface/transformers` (running local WASM `all-MiniLM-L6-v2` pipeline)
- **Visuals**: Recharts responsive analytics charts

### Multi-Tenant Security Boundary (Critical Rule)
Project LOOP enforces strict data isolation. Every query touching users, members, feedback, themes, or reports extracts the `workspaceId` from the authenticated user's session JWT token. **Company A cannot read or write data belonging to Company B, even if they guess records IDs in URLs or headers.**

---

## ═══════════════════════════════════════
## DEMO LOGIN CREDENTIALS
## ═══════════════════════════════════════

The database seed script populates a default workspace with 125 realistic multi-channel feedback records. You can sign in using any of the following roles:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@loop.com` | `Password123` | Full access, manage members, manual ingest, CSV upload, seed syncs, triage, Q&A, VoC reports |
| **ANALYST** | `analyst@loop.com` | `Password123` | Manual ingest, CSV upload, seed syncs, triage, Q&A, VoC reports |
| **VIEWER** | `viewer@loop.com` | `Password123` | Read-only access, view dashboard/inbox, Ask LOOP Q&A |

---

## ═══════════════════════════════════════
## LOCAL SETUP INSTRUCTIONS
## ═══════════════════════════════════════

Follow these steps to run Project LOOP locally on your system:

### 1. Configure Environment Variables
Copy `.env.example` in the root folder and rename it to `.env`:
```bash
# Rename the example configuration
copy .env.example .env
```
Open `.env` and fill out your credentials:
1. **`DATABASE_URL`**: Your PostgreSQL connection string. (Supabase or Neon free tiers are recommended, as they support the `vector` extension).
2. **`NEXTAUTH_SECRET`**: Run `openssl rand -base64 32` or type a secure random string.
3. **`ANTHROPIC_API_KEY`**: Your Claude API key from the Anthropic Console.

### 2. Run Database Migrations
Create the tables (including pgvector mapping columns) in your PostgreSQL database:
```bash
npx prisma migrate dev --name init
```
*Note: Make sure your Postgres database supports pgvector. Supabase and Neon have this enabled by default.*

### 3. Seed the Workspace Demo Data
Populate the database with the "Demo Workspace", the 3 accounts, and 125 pre-classified customer feedbacks with actual text embeddings:
```bash
npx prisma db seed
```

### 4. Start the Application
Install dependencies and run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the landing page!

---

## ═══════════════════════════════════════
## SYSTEM DIRECTORY STRUCTURE
## ═══════════════════════════════════════

- `/prisma/schema.prisma` — Relational database models and enums
- `/prisma/seed.ts` — 125 feedback records and 3-roles user generation seed
- `/src/lib/db.ts` — Reused global Prisma client
- `/src/lib/auth.ts` — Server session retrieval & role enforcement (RBAC) helpers
- `/src/lib/ai.ts` — Server-side Anthropic Claude prompts (Classification, Q&A, Reports)
- `/src/lib/search.ts` — WASM embeddings and raw SQL similarity search fallbacks
- `/src/app/api/auth/[...nextauth]` — Credentials provider auth route
- `/src/app/api/feedback` — Isolated feedback queries and CSV upload parsers
- `/src/app/api/analytics` — Live charts analytics compilation
- `/src/app/(auth)` — Sign up and Sign in frontends
- `/src/app/(app)` — Core layouts, paginated Inbox feed, Trends spike logs, Q&A chat, and PDF printable reports.
