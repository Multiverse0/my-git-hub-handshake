-- Add birth_date column to organization_members table
ALTER TABLE public.organization_members 
ADD COLUMN birth_date DATE;