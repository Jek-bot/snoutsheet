-- Storage RLS policies for the `pet-photos` bucket.
--
-- Pet photos are uploaded to a top-level folder named after the owner's auth
-- uid (see src/components/pets/PetPhotoUpload.jsx):
--     {auth.uid()}/{petId}-{timestamp}.jpg
--
-- A freshly-created bucket has RLS enabled on storage.objects with NO matching
-- policy, so writes are denied ("new row violates row-level security policy").
-- These policies let an authenticated user read/write only their own folder.
--
-- Idempotent: drops any prior versions (including the earlier ad-hoc policies)
-- then recreates a single policy per action. Run in the Supabase SQL editor.
-- The `pet-photos` bucket should also be marked Public so getPublicUrl()
-- images render in the app.

-- Earlier ad-hoc policies, superseded by the owner-scoped ones below.
drop policy if exists "authenticated users can upload pet photos" on storage.objects;
drop policy if exists "users can delete their own pet photos" on storage.objects;

drop policy if exists "pet-photos owner insert" on storage.objects;
drop policy if exists "pet-photos owner update" on storage.objects;
drop policy if exists "pet-photos owner delete" on storage.objects;
drop policy if exists "pet-photos public read" on storage.objects;

create policy "pet-photos owner insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet-photos owner update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet-photos owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read so pet photos display via their public URL. Omit this if the
-- bucket is already marked Public (public buckets serve reads via the CDN).
create policy "pet-photos public read"
  on storage.objects for select
  using ( bucket_id = 'pet-photos' );
