```
# Our Love Calendar ❤️

A private digital scrapbook for couples to preserve, organize, and relive memories.

---
*Auto-Redeploy Trigger: v1.0.1 - 2026-10-31*
---

## Features
- **Hero & Relationship Counter**: Dynamic live counter of days, months, and years together with next anniversary countdown.
- **Love Calendar**: Monthly interactive grid with visual memory indicators and date filtering.
- **Memory Scrapbook System**: Complete CRUD for relationship moments with mood tags, locations, songs, and client-side WebP compressed photo uploads (≤500 KB per photo).
- **Our Story Timeline**: Chronological milestone timeline tracking the journey of the relationship.
- **On This Day**: Relive memories created on today's exact date in past years.
- **Time Machine**: Signature feature to randomly jump back to any saved memory.
- **Favorites & Search**: Star moments and full-text search across titles, stories, locations, and songs.
- **Private Access & RLS**: Enforced multi-tenant isolation where only partners belonging to a shared relationship ID can access data.

## Zero-Cost Free-Tier Architecture
- **Frontend & Hosting**: Next.js App Router deployed on Vercel Hobby (Free).
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (Free).
- **Storage**: Supabase Storage with client-side WebP compression (Free).

## Getting Started

### 1. Supabase Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run `supabase/migrations/001_schema.sql`.
3. Next run `supabase/migrations/002_rls.sql`.
4. Create a private storage bucket named `memories`.

### 2. Environment Variables
Create `.env.local` based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Local Development
```bash
npm run dev
```

Visit `http://localhost:3000`.
