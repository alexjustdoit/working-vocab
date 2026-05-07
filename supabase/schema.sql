-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users settings table (extends Supabase auth.users)
create table public.user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  notification_email text,
  notif_channels text[] default '{}', -- 'email', 'telegram'
  notif_frequency text default 'daily', -- 'daily', '3x_week', 'weekly'
  notif_days text[] default '{mon,wed,fri}', -- used when frequency = '3x_week'
  notif_time text default '08:00', -- HH:MM in user's local time (stored as UTC offset)
  notif_time_utc_offset integer default 0, -- minutes offset from UTC
  notif_word_count integer default 3,
  telegram_chat_id text,
  telegram_connected_at timestamptz,
  telegram_verification_code text,
  telegram_verification_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "Users can read own settings"
  on public.user_settings for select
  using (auth.uid() = id);

create policy "Users can update own settings"
  on public.user_settings for update
  using (auth.uid() = id);

create policy "Users can insert own settings"
  on public.user_settings for insert
  with check (auth.uid() = id);

-- Words table
create table public.words (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  definition jsonb, -- raw response from Free Dictionary API
  part_of_speech text,
  phonetic text,
  status text not null default 'saved', -- 'saved', 'practicing', 'working'
  notes text,
  source_url text,
  source_domain text, -- extracted from source_url for display
  archived boolean not null default false,
  last_notified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.words enable row level security;

create policy "Users can read own words"
  on public.words for select
  using (auth.uid() = user_id);

create policy "Users can insert own words"
  on public.words for insert
  with check (auth.uid() = user_id);

create policy "Users can update own words"
  on public.words for update
  using (auth.uid() = user_id);

create policy "Users can delete own words"
  on public.words for delete
  using (auth.uid() = user_id);

-- Indices
create index words_user_id_idx on public.words(user_id);
create index words_status_idx on public.words(status);
create index words_archived_idx on public.words(archived);

-- Dialogue examples table
create table public.dialogue_examples (
  id uuid primary key default uuid_generate_v4(),
  word_id uuid not null references public.words(id) on delete cascade,
  text text not null,
  used_in_notification boolean not null default false,
  created_at timestamptz default now()
);

alter table public.dialogue_examples enable row level security;

create policy "Users can read own dialogue examples"
  on public.dialogue_examples for select
  using (
    exists (
      select 1 from public.words
      where words.id = dialogue_examples.word_id
      and words.user_id = auth.uid()
    )
  );

create policy "Users can insert own dialogue examples"
  on public.dialogue_examples for insert
  with check (
    exists (
      select 1 from public.words
      where words.id = dialogue_examples.word_id
      and words.user_id = auth.uid()
    )
  );

-- Function to auto-create user_settings row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (id, notification_email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger words_updated_at
  before update on public.words
  for each row execute procedure public.update_updated_at();

create trigger user_settings_updated_at
  before update on public.user_settings
  for each row execute procedure public.update_updated_at();
