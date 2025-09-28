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

const handler = async (req: Request): Promise<Response> => {
  console.log('📨 NotificationAPI handler called, method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    // Get NotificationAPI credentials from environment with detailed logging
    const clientId = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID');
    const clientSecret = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET');

    console.log('🔑 Credentials check:', {
      hasClientId: !!clientId,
      clientIdLength: clientId?.length || 0,
      hasClientSecret: !!clientSecret,
      clientSecretLength: clientSecret?.length || 0
    });

    if (!clientId || !clientSecret) {
      console.error('❌ Missing NotificationAPI credentials in Supabase secrets');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NotificationAPI credentials not configured in Supabase secrets. Please configure them in the Email Management section.' 
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
      hasSMS: !!payload.sms,
      templateId: payload.templateId,
      parametersCount: payload.parameters ? Object.keys(payload.parameters).length : 0
    });

    console.log('🚀 Initializing NotificationAPI...');
    // Initialize NotificationAPI SDK with proper credentials
    notificationapi.init(clientId.trim(), clientSecret.trim(), {
      baseURL: 'https://api.eu.notificationapi.com'
    });
    
    console.log('📤 Sending notification payload:', JSON.stringify(payload, null, 2));
    
    // Send notification using the payload directly
    const result = await notificationapi.send(payload);

    console.log('✅ Notification sent successfully via NotificationAPI');
    console.log('📊 Response data:', result.data);
    
    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.data?.messageId || result.data?.id || 'sent',
        data: result.data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('❌ Error in send-notification-api function:', error);
    
    // Enhanced error logging for debugging
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send notification',
        details: error.response?.data || error.toString()
      }),
      { 
        status: error.response?.status || 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);

// Test call example (uncomment to test)
/*
const testNotification = async () => {
  console.log('🧪 Testing NotificationAPI integration...');
  
  try {
    const result = await fetch('https://lwhrtzlpxgpmozrcxtrw.supabase.co/functions/v1/send-notification-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        type: 'aktivlogg',
        to: {
          id: 'yngve@promonorge.no',
          email: 'yngve@promonorge.no',
          number: '+2348145075300'
        },
        templateId: 'welcome_aktiv',
        parameters: {
          organizationName: 'Test Organization',
          recipientName: 'Test User',
          email: 'yngve@promonorge.no',
          loginUrl: 'https://your-app.com/login',
          adminName: 'Admin',
          memberNumber: '12345',
          password: 'test-password'
        }
      })
    });
    
    const data = await response.json();
    console.log('✅ Test result:', data);
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// To test: testNotification();
*/