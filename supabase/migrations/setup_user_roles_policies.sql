-- Create the function to setup RLS policies
create or replace function setup_user_roles_policies()
returns void
language plpgsql
security definer
as $$
begin
    -- Drop existing policies if they exist
    drop policy if exists "Users can view their own role" on public.user_roles;
    drop policy if exists "Admins can view all roles" on public.user_roles;
    drop policy if exists "Admins can insert roles" on public.user_roles;
    drop policy if exists "Admins can update roles" on public.user_roles;
    drop policy if exists "Admins can delete roles" on public.user_roles;

    -- Create policies
    create policy "Users can view their own role"
        on public.user_roles
        for select
        using (auth.uid() = user_id);

    create policy "Admins can view all roles"
        on public.user_roles
        for select
        using (
            exists (
                select 1 from public.user_roles
                where user_id = auth.uid()
                and role = 'admin'
            )
        );

    create policy "Admins can insert roles"
        on public.user_roles
        for insert
        with check (
            exists (
                select 1 from public.user_roles
                where user_id = auth.uid()
                and role = 'admin'
            )
        );

    create policy "Admins can update roles"
        on public.user_roles
        for update
        using (
            exists (
                select 1 from public.user_roles
                where user_id = auth.uid()
                and role = 'admin'
            )
        );

    create policy "Admins can delete roles"
        on public.user_roles
        for delete
        using (
            exists (
                select 1 from public.user_roles
                where user_id = auth.uid()
                and role = 'admin'
            )
        );
end;
$$;
