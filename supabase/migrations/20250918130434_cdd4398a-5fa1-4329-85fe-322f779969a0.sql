-- Add registration code to organizations table for self-service member registration
ALTER TABLE public.organizations ADD COLUMN registration_code TEXT;