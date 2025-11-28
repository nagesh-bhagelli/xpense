-- Create profiles table for user data
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  currency text default 'USD',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create expenses table
create table public.expenses (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  amount decimal(10, 2) not null,
  category text not null,
  description text,
  payment_method text,
  expense_date date not null default current_date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS on expenses
alter table public.expenses enable row level security;

-- Expenses policies
create policy "Users can view their own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can create their own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- Trigger for expenses updated_at
create trigger update_expenses_updated_at
  before update on public.expenses
  for each row execute function public.update_updated_at_column();