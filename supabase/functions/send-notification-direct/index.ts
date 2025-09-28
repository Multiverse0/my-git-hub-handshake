import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import notificationapi from "npm:notificationapi-node-server-sdk@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: string;
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

async function sendWithRetry(payload: NotificationRequest, maxAttempts = 3): Promise<any> {
  let baseURL = EU_BASE;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      initSdk(baseURL);
      console.log(`📤 Attempt ${attempt}/${maxAttempts} - sending notification...`);
      const result = await notificationapi.send(payload as any);
      console.log('✅ NotificationAPI success:', result.data);
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      const statusText = error?.response?.statusText;
      const msg = error?.message || error?.toString();
      console.error(`❌ Attempt ${attempt} failed:`, { status, statusText, msg, data: error?.response?.data });

      const retriable = status ? status >= 500 : true; // network/unknown treated as retriable

      // On first server failure, try fallback to GLOBAL base URL
      if (attempt === 1 && retriable && baseURL === EU_BASE) {
        console.warn('🌍 Switching baseURL to GLOBAL for retry...');
        baseURL = GLOBAL_BASE;
      }

      if (attempt < maxAttempts && retriable) {
        const backoff = 300 * attempt;
        console.log(`⏳ Retrying in ${backoff}ms...`);
        await delay(backoff);
        continue;
      }

      throw error;
    }
  }
  throw new Error('NotificationAPI send failed after retries');
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
      type: payload.type,
      to: payload.to?.email,
      templateId: payload.templateId,
      params: payload.parameters ? Object.keys(payload.parameters) : []
    });

    const result: any = await sendWithRetry(payload);

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.data?.messageId || result.data?.id || 'sent',
        data: result.data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('💥 send-notification-direct error:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      response: error?.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    });

    const status = error?.response?.status || 500;
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || 'Failed to send notification',
        details: error?.response?.data || error?.toString()
      }),
      { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
