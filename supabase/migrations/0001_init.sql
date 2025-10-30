create extension if not exists "pgcrypto";

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  ical_url text not null,
  created_at timestamptz default now()
);

create table if not exists bookings (
  uid text primary key,
  property_id uuid references properties(id) on delete cascade,
  checkin timestamptz,
  checkout timestamptz,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cleans (
  id uuid primary key default gen_random_uuid(),
  booking_uid text references bookings(uid) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  scheduled_for timestamptz,
  notes text,
  status text default 'scheduled',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade,
  run_at timestamptz default now(),
  bookings_added int default 0,
  bookings_removed int default 0,
  bookings_updated int default 0
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'bookings_set_updated_at'
  ) then
    create trigger bookings_set_updated_at
    before update on bookings
    for each row execute procedure set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'cleans_set_updated_at'
  ) then
    create trigger cleans_set_updated_at
    before update on cleans
    for each row execute procedure set_updated_at();
  end if;
end $$;

alter table properties enable row level security;
alter table bookings enable row level security;
alter table cleans enable row level security;
alter table sync_logs enable row level security;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and policyname = 'Users manage own properties'
  ) then
    execute $ddl$
      create policy "Users manage own properties"
      on properties
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    $ddl$;
  end if;
end
$policy$;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'Users manage own bookings'
  ) then
    execute $ddl$
      create policy "Users manage own bookings"
      on bookings
      for all
      using (
        exists (
          select 1 from properties p
          where p.id = property_id and p.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from properties p
          where p.id = property_id and p.user_id = auth.uid()
        )
      );
    $ddl$;
  end if;
end
$policy$;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cleans'
      and policyname = 'Users manage own cleans'
  ) then
    execute $ddl$
      create policy "Users manage own cleans"
      on cleans
      for all
      using (
        exists (
          select 1 from properties p
          where p.id = property_id and p.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from properties p
          where p.id = property_id and p.user_id = auth.uid()
        )
      );
    $ddl$;
  end if;
end
$policy$;

do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sync_logs'
      and policyname = 'Users view own sync logs'
  ) then
    execute $ddl$
      create policy "Users view own sync logs"
      on sync_logs
      for select
      using (
        exists (
          select 1 from properties p
          where p.id = property_id and p.user_id = auth.uid()
        )
      );
    $ddl$;
  end if;
end
$policy$;
