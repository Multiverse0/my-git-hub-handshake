import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// NotificationAPI SDK for Deno
class NotificationAPI {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;

  constructor(clientId: string, clientSecret: string, options: { baseURL?: string } = {}) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = options.baseURL || 'https://api.notificationapi.com';
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
      const response = await fetch(`${this.baseURL}/v1/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('NotificationAPI send error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

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
    // Get secrets from environment
    const clientId = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing NotificationAPI credentials');
      return new Response(
        JSON.stringify({ error: 'Missing NotificationAPI credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Parse request body
    const notificationRequest: NotificationRequest = await req.json();

    console.log('NotificationAPI request:', {
      type: notificationRequest.type,
      to: notificationRequest.to.email,
      hasEmail: !!notificationRequest.email,
      hasSMS: !!notificationRequest.sms,
    });

    // Initialize NotificationAPI
    const notificationApi = new NotificationAPI(clientId, clientSecret, {
      baseURL: 'https://api.eu.notificationapi.com'
    });

    // Send notification
    const result = await notificationApi.send(notificationRequest);

    if (!result.success) {
      console.error('NotificationAPI send failed:', result.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'Failed to send notification' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('NotificationAPI send successful:', result.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data,
        messageId: result.data?.id || 'unknown'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in send-notification-api function:', error);
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