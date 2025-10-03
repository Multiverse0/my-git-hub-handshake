import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import notificationapi from "npm:notificationapi-node-server-sdk@2.5.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type?: string;
  to: {
    id: string;
    email: string;
    number?: string;
  };
  email?: {
    subject: string;
    html: string;
  };
  sms?: {
    message: string;
  };
  templateId?: string;
  parameters?: Record<string, any>;
}

// Hardcoded NotificationAPI credentials as requested
const CLIENT_ID = '77lscar5yxsnwqzlt6f2tl2d9x';
const CLIENT_SECRET = 'nq7a8lye0agd50h0yhsg131ezwqt66n3ybqnhtzzbl9w582mg9r1n2by2y';

const EU_BASE = 'https://api.eu.notificationapi.com';
const GLOBAL_BASE = 'https://api.notificationapi.com';

function initSdk(baseURL: string) {
  console.log('🔧 Initializing NotificationAPI SDK with baseURL:', baseURL);
  notificationapi.init(CLIENT_ID, CLIENT_SECRET, { baseURL });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWithNotificationAPI(payload: NotificationRequest, maxAttempts = 2): Promise<any> {
  let baseURL = EU_BASE;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      initSdk(baseURL);
      console.log(`📤 NotificationAPI attempt ${attempt}/${maxAttempts}...`);
      const result = await notificationapi.send(payload as any);
      console.log('✅ NotificationAPI success:', result.data);
      return { success: true, provider: 'notificationapi', data: result.data };
    } catch (error: any) {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const msg = error?.message || error?.toString();
      console.error(`❌ NotificationAPI attempt ${attempt} failed:`, { status, statusText, msg, data: error?.response?.data });

      // Switch to global endpoint on first failure
      if (attempt === 1 && baseURL === EU_BASE) {
        console.warn('🌍 Switching to GLOBAL endpoint...');
        baseURL = GLOBAL_BASE;
        await delay(300);
        continue;
      }

      // Return error info for fallback decision
      return { 
        success: false, 
        provider: 'notificationapi', 
        error: msg,
        status,
        shouldFallback: status === 401 || status === 403 || status >= 500
      };
    }
  }
  return { success: false, provider: 'notificationapi', error: 'Failed after retries', shouldFallback: true };
}

async function sendWithResend(payload: NotificationRequest): Promise<any> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, provider: 'resend', error: 'Resend not configured' };
    }

    const resend = new Resend(resendApiKey);
    const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'AKTIVLOGG';
    const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@aktivlogg.no';
    const from = `${fromName} <${fromAddress}>`;

    if (!payload.email?.subject || !payload.email?.html) {
      return { success: false, provider: 'resend', error: 'Email content missing' };
    }

    console.log('📤 Sending via Resend from:', from);
    const result = await resend.emails.send({
      from,
      to: [payload.to.email],
      subject: payload.email.subject,
      html: payload.email.html
    });

    // Check if Resend returned an error
    if (result.error) {
      console.error('❌ Resend failed:', result.error);
      return { 
        success: false, 
        provider: 'resend', 
        error: result.error.message || 'Resend failed',
        statusCode: result.error.statusCode
      };
    }

    console.log('✅ Resend success:', result.data);
    return { success: true, provider: 'resend', data: result.data };
  } catch (error: any) {
    console.error('❌ Resend error:', error);
    return { success: false, provider: 'resend', error: error.message || 'Resend failed' };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('📨 send-notification-direct called, method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const payload: NotificationRequest = await req.json();
    console.log('📦 Payload received:', {
      to: payload.to?.email,
      hasEmail: !!payload.email,
      templateId: payload.templateId
    });

    const providerErrors: string[] = [];

    // Use Resend as primary provider for direct email requests (password resets)
    if (payload.email && !payload.templateId) {
      console.log('📧 Using Resend as primary provider (direct email)');
      const resendResult = await sendWithResend(payload);
      
      if (resendResult.success) {
        return new Response(
          JSON.stringify({
            success: true,
            messageId: resendResult.data?.id || 'sent',
            provider: 'resend'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      providerErrors.push(`Resend: ${resendResult.error}`);
    }

    // Try NotificationAPI for template-based notifications
    if (payload.templateId) {
      const notifResult = await sendWithNotificationAPI(payload);
      
      if (notifResult.success) {
        return new Response(
          JSON.stringify({
            success: true,
            messageId: notifResult.data?.messageId || notifResult.data?.id || 'sent',
            provider: 'notificationapi'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      providerErrors.push(`NotificationAPI: ${notifResult.error}`);
    }

    // All providers failed
    console.error('💥 All providers failed:', providerErrors);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to send notification via all providers',
        provider_errors: providerErrors
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('💥 Unexpected error in send-notification-direct:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Unexpected error occurred',
        details: error?.toString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
