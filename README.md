# Working Vocab

Build words into your working vocabulary — not just knowing what they mean, but being able to use them in conversation.

## Features

- Save words while reading (manual entry or bookmarklet)
- Source URL tracked so you can jump back to the original article
- AI-generated dialogue examples showing natural conversational use (Gemini Flash)
- Word status progression: Saved → Practicing → Working Vocab
- Periodic notifications with fresh examples to reinforce words you're practicing
- Telegram notifications (push to mobile)

## Stack

- Next.js 16 + Vercel
- Supabase (Postgres + auth)
- Gemini Flash (free tier) — dialogue generation
- Telegram Bot API — notifications
- Resend — email notifications (not yet enabled, see below)

## Deploy

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor
2. Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com)
3. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and note the token
4. Update the bot username in `src/components/SettingsForm.tsx` (`const botName = "..."`)
5. Deploy to Vercel and set env vars (see `.env.local.example`)
6. Register the Telegram webhook after deploying:
   ```
   POST https://api.telegram.org/bot{TOKEN}/setWebhook?url={APP_URL}/api/telegram/webhook
   ```
7. Set up the notification cron job (see below)

## Environment variables

See `.env.local.example` for the full list. For local dev, copy it to `.env.local` and fill in real values.

## Notification cron job

Vercel's free plan only allows one cron job per day, which isn't enough for per-user notification scheduling. Instead, use [cron-job.org](https://cron-job.org) (free) to call the notify endpoint hourly:

1. Create a free account at cron-job.org
2. Create a new cron job:
   - **URL:** `https://your-app.vercel.app/api/cron/notify`
   - **Schedule:** every hour (`0 * * * *`)
   - **Request method:** GET
   - **Headers:** add `Authorization: Bearer YOUR_CRON_SECRET`
3. Enable the job

The endpoint checks each user's configured notification time and only sends when their scheduled hour matches — so running it hourly gives each user precise control over their notification time.

## Notifications

**Telegram** is the supported notification channel. Users connect their Telegram account in Settings and receive word notifications as push messages.

**Email notifications** are built but not recommended until a custom sending domain is configured in Resend. Without a verified domain, Resend's `onboarding@resend.dev` sender can only deliver to the account owner's email — other users won't receive emails. To enable for all users: add a domain in the Resend dashboard, verify the DNS records, then update `RESEND_FROM_EMAIL` in your env vars. The email templates and dispatch logic are already in place in `src/lib/notifications.ts`.
