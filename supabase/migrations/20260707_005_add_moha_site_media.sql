-- =========================================================
-- MOHA — WEBSITE MEDIA MANAGEMENT
-- =========================================================

-- ---------------------------------------------------------
-- 1. Website image records
-- ---------------------------------------------------------

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),

  salon_id uuid not null
    references public.salons(id)
    on delete cascade,

  -- gallery = appears in homepage gallery and can feed hero mosaic
  -- service = appears on a specific service card
  placement text not null
    check (placement in ('gallery', 'service')),

  service_id uuid
    references public.services(id)
    on delete set null,

  storage_path text not null unique,

  title text not null default '',
  subtitle text,
  alt_text text not null default 'MOHA nail set',

  sort_order integer not null default 0,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint site_images_service_placement_check
    check (
      (placement = 'gallery' and service_id is null)
      or
      (placement = 'service' and service_id is not null)
    )
);

drop trigger if exists site_images_set_updated_at on public.site_images;

create trigger site_images_set_updated_at
before update on public.site_images
for each row
execute function public.set_updated_at();

create index if not exists site_images_salon_placement_index
on public.site_images (salon_id, placement, sort_order);

-- ---------------------------------------------------------
-- 2. Only MOHA owner/admin can manage website images
-- ---------------------------------------------------------

create or replace function public.can_manage_moha_media()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.salon_members as members
    join public.salons as salons
      on salons.id = members.salon_id
    where members.user_id = auth.uid()
      and salons.slug = 'moha'
      and members.role in (
        'owner'::public.moha_member_role,
        'admin'::public.moha_member_role
      )
  );
$$;

revoke all on function public.can_manage_moha_media() from public;
grant execute on function public.can_manage_moha_media() to authenticated;

-- ---------------------------------------------------------
-- 3. RLS for image records
-- ---------------------------------------------------------

alter table public.site_images enable row level security;

grant select on public.site_images to anon, authenticated;
grant insert, update, delete on public.site_images to authenticated;

drop policy if exists "Public can view active MOHA site images" on public.site_images;
create policy "Public can view active MOHA site images"
on public.site_images
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "MOHA managers can manage site images" on public.site_images;
create policy "MOHA managers can manage site images"
on public.site_images
for all
to authenticated
using (
  (select public.can_manage_moha_media())
)
with check (
  (select public.can_manage_moha_media())
);

-- ---------------------------------------------------------
-- 4. Public bucket for already-compressed homepage images
-- Strict 100 KB limit = 102400 bytes
-- ---------------------------------------------------------

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'moha-site-media',
  'moha-site-media',
  true,
  102400,
  array['image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------
-- 5. Public can read images; only MOHA owner/admin can write
-- ---------------------------------------------------------

drop policy if exists "Public can view MOHA website media" on storage.objects;
create policy "Public can view MOHA website media"
on storage.objects
for select
to public
using (
  bucket_id = 'moha-site-media'
);

drop policy if exists "MOHA managers can upload website media" on storage.objects;
create policy "MOHA managers can upload website media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'moha-site-media'
  and (select public.can_manage_moha_media())
);

drop policy if exists "MOHA managers can update website media" on storage.objects;
create policy "MOHA managers can update website media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'moha-site-media'
  and (select public.can_manage_moha_media())
)
with check (
  bucket_id = 'moha-site-media'
  and (select public.can_manage_moha_media())
);

drop policy if exists "MOHA managers can delete website media" on storage.objects;
create policy "MOHA managers can delete website media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'moha-site-media'
  and (select public.can_manage_moha_media())
);