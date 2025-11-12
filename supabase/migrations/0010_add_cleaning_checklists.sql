-- Create table for cleaning checklist templates per property
create table if not exists cleaning_checklists (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id) on delete cascade not null,
  room text not null,
  task text not null,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create table for tracking completion of checklist items per clean
create table if not exists clean_checklist_completions (
  id uuid primary key default gen_random_uuid(),
  clean_id uuid references cleans(id) on delete cascade not null,
  checklist_item_id uuid references cleaning_checklists(id) on delete cascade not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(clean_id, checklist_item_id)
);

-- Create indexes for better performance
create index if not exists cleaning_checklists_property_id_idx on cleaning_checklists (property_id);
create index if not exists clean_checklist_completions_clean_id_idx on clean_checklist_completions (clean_id);
create index if not exists clean_checklist_completions_checklist_item_id_idx on clean_checklist_completions (checklist_item_id);

-- Add RLS policies
alter table cleaning_checklists enable row level security;
alter table clean_checklist_completions enable row level security;

-- Policy for cleaning_checklists: users can manage checklists for their own properties
do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cleaning_checklists'
      and policyname = 'Users manage own property checklists'
  ) then
    execute $ddl$
      create policy "Users manage own property checklists"
      on cleaning_checklists
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

-- Policy for clean_checklist_completions: users can manage completions for cleans in their properties
do $policy$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'clean_checklist_completions'
      and policyname = 'Users manage own clean checklist completions'
  ) then
    execute $ddl$
      create policy "Users manage own clean checklist completions"
      on clean_checklist_completions
      for all
      using (
        exists (
          select 1 from cleans c
          join properties p on c.property_id = p.id
          where c.id = clean_id and p.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from cleans c
          join properties p on c.property_id = p.id
          where c.id = clean_id and p.user_id = auth.uid()
        )
      );
    $ddl$;
  end if;
end
$policy$;

-- Trigger to update timestamps
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
    select 1 from pg_trigger where tgname = 'cleaning_checklists_set_updated_at'
  ) then
    create trigger cleaning_checklists_set_updated_at
    before update on cleaning_checklists
    for each row execute procedure set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'clean_checklist_completions_set_updated_at'
  ) then
    create trigger clean_checklist_completions_set_updated_at
    before update on clean_checklist_completions
    for each row execute procedure set_updated_at();
  end if;
end $$;