-- Add subscription management to organizations table
ALTER TABLE organizations 
ADD COLUMN subscription_type TEXT DEFAULT 'starter' CHECK (subscription_type IN ('starter', 'professional', 'enterprise')),
ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'cancelled')),
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for performance
CREATE INDEX idx_organizations_subscription ON organizations (subscription_type, subscription_status);

-- Update existing organizations to have default subscription
UPDATE organizations 
SET subscription_type = 'starter', 
    subscription_status = 'active' 
WHERE subscription_type IS NULL;