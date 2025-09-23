import { supabase } from "../integrations/supabase/client";

export interface UrlConfig {
  base_url: string;
  custom_domain: string | null;
  enable_tracking: boolean;
  reset_password_path: string;
  login_path: string;
  email_preferences_path: string;
}

export interface EmailBranding {
  custom_template: boolean;
  header_color: string;
  footer_text: string;
  logo_url: string | null;
}

// Environment detection
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }
  
  return 'production';
};

// Get base URL based on environment
export const getBaseUrl = (): string => {
  const env = getEnvironment();
  
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback URLs for different environments
  switch (env) {
    case 'development':
      return 'http://localhost:3000';
    case 'staging':
      return 'https://staging.lovable.app';
    default:
      return 'https://lovable.app';
  }
};

// Get organization URL configuration
export const getOrganizationUrlConfig = async (organizationId: string): Promise<UrlConfig> => {
  const { data, error } = await supabase
    .from('email_settings')
    .select('setting_value')
    .eq('organization_id', organizationId)
    .eq('setting_key', 'url_config')
    .maybeSingle();

  if (error) {
    console.error('Error fetching URL config:', error);
    return getDefaultUrlConfig();
  }

  return (data?.setting_value as unknown as UrlConfig) || getDefaultUrlConfig();
};

// Get organization branding configuration
export const getOrganizationBranding = async (organizationId: string): Promise<EmailBranding> => {
  const { data, error } = await supabase
    .from('email_settings')
    .select('setting_value')
    .eq('organization_id', organizationId)
    .eq('setting_key', 'branding')
    .maybeSingle();

  if (error) {
    console.error('Error fetching branding config:', error);
    return getDefaultBranding();
  }

  return (data?.setting_value as unknown as EmailBranding) || getDefaultBranding();
};

// Default configurations
const getDefaultUrlConfig = (): UrlConfig => ({
  base_url: getBaseUrl(),
  custom_domain: null,
  enable_tracking: true,
  reset_password_path: '/reset-password',
  login_path: '/login',
  email_preferences_path: '/profile/email-preferences'
});

const getDefaultBranding = (): EmailBranding => ({
  custom_template: false,
  header_color: '#FFD700',
  footer_text: 'Powered by AktivLogg',
  logo_url: null
});

// Generate email URLs with tracking
export const generateEmailUrl = (
  baseUrl: string,
  path: string,
  params?: Record<string, string>,
  trackingId?: string
): string => {
  const url = new URL(path, baseUrl);
  
  // Add query parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  // Add tracking parameters
  if (trackingId) {
    url.searchParams.set('utm_source', 'email');
    url.searchParams.set('utm_medium', 'notification');
    url.searchParams.set('tracking_id', trackingId);
  }
  
  return url.toString();
};

// Generate password reset URL
export const generatePasswordResetUrl = async (
  organizationSlug: string,
  token?: string,
  tokenHash?: string
): Promise<string> => {
  const baseUrl = getBaseUrl();
  const path = `/reset-password`;
  
  const params: Record<string, string> = {
    org: organizationSlug
  };
  
  if (token) params.token = token;
  if (tokenHash) params.token_hash = tokenHash;
  
  return generateEmailUrl(baseUrl, path, params);
};

// Generate login URL
export const generateLoginUrl = (organizationSlug: string, trackingId?: string): string => {
  const baseUrl = getBaseUrl();
  const path = `/login`;
  
  const params = { org: organizationSlug };
  
  return generateEmailUrl(baseUrl, path, params, trackingId);
};

// Generate email preferences URL
export const generateEmailPreferencesUrl = (organizationSlug: string, trackingId?: string): string => {
  const baseUrl = getBaseUrl();
  const path = `/profile/email-preferences`;
  
  const params = { org: organizationSlug };
  
  return generateEmailUrl(baseUrl, path, params, trackingId);
};

// Generate unsubscribe URL
export const generateUnsubscribeUrl = (
  organizationSlug: string,
  memberId: string,
  emailType: string
): string => {
  const baseUrl = getBaseUrl();
  const path = `/unsubscribe`;
  
  const params = {
    org: organizationSlug,
    member: memberId,
    type: emailType
  };
  
  return generateEmailUrl(baseUrl, path, params);
};

// Validate email URL
export const validateEmailUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Generate signed URL for sensitive operations
export const generateSignedUrl = (
  baseUrl: string,
  path: string,
  params: Record<string, string>,
  secret: string,
  expiresInHours: number = 24
): string => {
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresInHours * 3600);
  const signatureData = `${path}${JSON.stringify(params)}${expiresAt}`;
  
  // Simple signature generation (in production, use proper HMAC)
  const signature = btoa(signatureData + secret).slice(0, 16);
  
  const allParams = {
    ...params,
    expires: expiresAt.toString(),
    signature
  };
  
  return generateEmailUrl(baseUrl, path, allParams);
};