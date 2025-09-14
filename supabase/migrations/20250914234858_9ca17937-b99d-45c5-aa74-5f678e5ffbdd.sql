-- Phase 1: Database Schema Alignment (Fixed)
-- Add missing fields to organization_members table to match profiles structure

-- Add missing fields to organization_members
ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS startkort_file_name TEXT,
ADD COLUMN IF NOT EXISTS diploma_file_name TEXT,
ADD COLUMN IF NOT EXISTS other_files JSONB DEFAULT '[]'::jsonb;

-- Add unique constraint on email for profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Create a function to sync organization_members to profiles
CREATE OR REPLACE FUNCTION public.sync_member_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update the profiles table when organization_members is modified
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        member_number,
        avatar_url,
        startkort_url,
        diploma_url,
        startkort_file_name,
        diploma_file_name,
        other_files,
        role,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(), -- Generate new UUID for profiles
        NEW.email,
        NEW.full_name,
        NEW.member_number,
        NEW.avatar_url,
        NEW.startkort_url,
        NEW.diploma_url,
        NEW.startkort_file_name,
        NEW.diploma_file_name,
        NEW.other_files,
        NEW.role,
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        member_number = EXCLUDED.member_number,
        avatar_url = EXCLUDED.avatar_url,
        startkort_url = EXCLUDED.startkort_url,
        diploma_url = EXCLUDED.diploma_url,
        startkort_file_name = EXCLUDED.startkort_file_name,
        diploma_file_name = EXCLUDED.diploma_file_name,
        other_files = EXCLUDED.other_files,
        role = EXCLUDED.role,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic sync
DROP TRIGGER IF EXISTS sync_member_to_profile_trigger ON public.organization_members;
CREATE TRIGGER sync_member_to_profile_trigger
    AFTER INSERT OR UPDATE ON public.organization_members
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_member_to_profile();

-- Create reverse sync function (profiles to organization_members)
CREATE OR REPLACE FUNCTION public.sync_profile_to_member()
RETURNS TRIGGER AS $$
BEGIN
    -- Update organization_members when profiles is modified
    UPDATE public.organization_members SET
        full_name = NEW.full_name,
        member_number = NEW.member_number,
        avatar_url = NEW.avatar_url,
        startkort_url = NEW.startkort_url,
        diploma_url = NEW.diploma_url,
        startkort_file_name = NEW.startkort_file_name,
        diploma_file_name = NEW.diploma_file_name,
        other_files = NEW.other_files,
        updated_at = NEW.updated_at
    WHERE email = NEW.email;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create reverse trigger
DROP TRIGGER IF EXISTS sync_profile_to_member_trigger ON public.profiles;
CREATE TRIGGER sync_profile_to_member_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_profile_to_member();

-- Migrate existing organization_members data to profiles
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    member_number,
    avatar_url,
    startkort_url,
    diploma_url,
    startkort_file_name,
    diploma_file_name,
    other_files,
    role,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    email,
    full_name,
    member_number,
    avatar_url,
    startkort_url,
    diploma_url,
    startkort_file_name,
    diploma_file_name,
    COALESCE(other_files, '[]'::jsonb),
    role,
    created_at,
    updated_at
FROM public.organization_members
ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    member_number = EXCLUDED.member_number,
    avatar_url = EXCLUDED.avatar_url,
    startkort_url = EXCLUDED.startkort_url,
    diploma_url = EXCLUDED.diploma_url,
    startkort_file_name = EXCLUDED.startkort_file_name,
    diploma_file_name = EXCLUDED.diploma_file_name,
    other_files = EXCLUDED.other_files,
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;