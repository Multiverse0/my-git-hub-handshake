-- Enable Row Level Security on critical tables to activate existing policies

-- Enable RLS on organization_members table
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles table  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on super_users table
ALTER TABLE public.super_users ENABLE ROW LEVEL SECURITY;