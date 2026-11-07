-- Lista de espera de Vyrtu Corporation.
-- La web solo puede INSERTAR (rol anon). No hay política de SELECT, UPDATE ni DELETE:
-- nadie puede leer ni modificar los emails desde el navegador.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null
              check (char_length(email) between 3 and 254 and email = lower(email)),
  interest    text not null
              check (interest in ('vyrtuos', 'nutrios', 'ropa')),
  created_at  timestamptz not null default now(),
  constraint waitlist_email_interest_key unique (email, interest)
);

alter table public.waitlist enable row level security;

-- Solo inserción, para usuarios anónimos (la anon key de la web).
drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- Sin políticas de select/update/delete: RLS las deniega para anon y authenticated.
revoke all on public.waitlist from anon, authenticated;
grant insert on public.waitlist to anon;
