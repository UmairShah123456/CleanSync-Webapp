-- Create user_profiles table to store user information
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table user_profiles enable row level security;

-- Create policy for users to manage their own profile
do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Users manage own profile'
  ) then
    execute $ddl$
      create policy "Users manage own profile"
      on user_profiles
      for all
      using (auth.uid() = id)
      with check (auth.uid() = id);
    $ddl$;
  end if;
end
$policy$;

-- Add trigger to update updated_at timestamp
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'user_profiles_set_updated_at'
  ) then
    create trigger user_profiles_set_updated_at
    before update on user_profiles
    for each row execute procedure set_updated_at();
  end if;
end $$;
