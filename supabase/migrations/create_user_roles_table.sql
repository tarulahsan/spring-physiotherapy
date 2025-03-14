-- Create the function to initialize the user_roles table
create or replace function create_user_roles_table()
returns void
language plpgsql
security definer
as $$
begin
    -- Check if table exists
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'user_roles') then
        -- Create the user_roles table
        create table public.user_roles (
            id uuid default uuid_generate_v4() primary key,
            user_id uuid references auth.users(id) on delete cascade,
            role text not null check (role in ('admin', 'viewer')),
            created_at timestamp with time zone default timezone('utc'::text, now()) not null,
            updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
            unique(user_id)
        );

        -- Create the trigger function if it doesn't exist
        create or replace function public.set_user_roles_updated_at()
        returns trigger as
        $$
        begin
            new.updated_at = timezone('utc', now());
            return new;
        end;
        $$ language plpgsql;

        -- Create the trigger if it doesn't exist
        drop trigger if exists set_updated_at_user_roles on public.user_roles;
        create trigger set_updated_at_user_roles
            before update on public.user_roles
            for each row
            execute function public.set_user_roles_updated_at();

        -- Enable RLS
        alter table public.user_roles enable row level security;
    end if;
end;
$$;
