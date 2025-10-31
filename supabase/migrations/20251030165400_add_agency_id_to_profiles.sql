-- supabase/migrations/YYYYMMDDHHMMSS_add_agency_id_to_profiles.sql

ALTER TABLE public.profiles
ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.profiles.agency_id IS 'Foreign key to the agencies table, linking the user profile to their agency.';
