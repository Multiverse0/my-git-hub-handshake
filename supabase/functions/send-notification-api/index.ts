import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// NotificationAPI SDK implementation for Deno
class NotificationAPI {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = 'https://api.eu.notificationapi.com';
  }

  init(clientId: string, clientSecret: string, options: { baseURL?: string } = {}) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = options.baseURL || 'https://api.eu.notificationapi.com';
  }

  async send(payload: {
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
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔔 Sending notification via NotificationAPI:', {
        type: payload.type,
        to: payload.to.email,
        hasEmail: !!payload.email,
        hasSMS: !!payload.sms
      });

      const response = await fetch(`${this.baseURL}/v1/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ NotificationAPI error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ NotificationAPI success:', data);
      return { 
        success: true, 
        data 
      };

    } catch (error: any) {
      console.error('❌ NotificationAPI network error:', error);
      return {
        success: false,
        error: error.message || 'Network error'
      };
    }
  }
}

// Create a single instance to mimic the official SDK pattern
const notificationapi = new NotificationAPI('', '');

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
}

const handler = async (req: Request): Promise<Response> => {
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
    // Get NotificationAPI credentials from environment
    const clientId = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('❌ Missing NotificationAPI credentials');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NotificationAPI credentials not configured' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request body
    const payload: NotificationRequest = await req.json();
    console.log('📨 Received notification request:', {
      type: payload.type,
      to: payload.to?.email,
      hasEmail: !!payload.email,
      hasSMS: !!payload.sms
    });

    // Initialize NotificationAPI SDK-style
    notificationapi.init(clientId, clientSecret, {
      baseURL: 'https://api.eu.notificationapi.com'
    });
    
    // Send notification - handles ALL channels in ONE call
    const result = await notificationapi.send(payload);

    console.log('✅ Notification sent successfully via NotificationAPI:', result.data);
    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.data?.messageId || result.data?.id,
        data: result.data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-notification-api function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);

// Test call example (commented out - uncomment to test)
/*
// This is how you would test the notification (run this separately):
const testNotification = async () => {
  const response = await fetch('https://lwhrtzlpxgpmozrcxtrw.supabase.co/functions/v1/send-notification-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
    },
    body: JSON.stringify({
      type: 'aktivlogg',
      to: {
        id: 'yngve@promonorge.no',
        email: 'yngve@promonorge.no',
        number: '+15005550006'
      },
      email: {
        subject: 'Test Notification - AKTIVLOGG',
        html: '<h1>Hello from NotificationAPI!</h1><p>This is a test email with beautiful styling.</p>'
      },
      sms: {
        message: 'Hello from AKTIVLOGG! This is a test SMS.'
      }
    })
  });
  
  const result = await response.json();
  console.log('Test result:', result);
};
*/