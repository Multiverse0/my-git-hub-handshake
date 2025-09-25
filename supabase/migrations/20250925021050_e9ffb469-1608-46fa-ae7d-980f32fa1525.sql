-- Step 1: Drop the existing constraint that only allows old subscription types
ALTER TABLE public.organizations 
DROP CONSTRAINT organizations_subscription_type_check;

-- Step 2: Update all existing subscription types to the new ones
UPDATE public.organizations 
SET subscription_type = 'start' 
WHERE subscription_type = 'starter';

UPDATE public.organizations 
SET subscription_type = 'ubegrenset' 
WHERE subscription_type IN ('professional', 'enterprise');

-- Step 3: Add new constraint with correct subscription types
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_subscription_type_check 
CHECK (subscription_type IN ('start', 'ubegrenset'));

-- Step 4: Update the default value for new organizations
ALTER TABLE public.organizations 
ALTER COLUMN subscription_type SET DEFAULT 'start';