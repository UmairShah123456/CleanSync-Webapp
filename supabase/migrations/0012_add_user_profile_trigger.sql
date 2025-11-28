-- Function to handle new user creation
-- This function runs with security definer privileges to bypass RLS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, first_name, last_name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    now(),
    now()
  );
  return new;
exception
  when others then
    -- Log the error but don't fail the signup
    raise warning 'Failed to create user profile: %', sqlerrm;
    return new;
end;
$$;

-- Grant execute permission on the function
grant execute on function public.handle_new_user() to authenticated;
grant execute on function public.handle_new_user() to anon;

-- Trigger to automatically create user profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
