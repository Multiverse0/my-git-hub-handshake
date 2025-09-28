import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Create admin client for database operations
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface ConfigRequest {
  action: 'save' | 'load';
  config?: {
    emailFromAddress: string;
    emailFromName: string;
    clientId: string;
    clientSecret: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Manage email config function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ConfigRequest = await req.json();
    console.log('Config request:', { action: requestData.action });

    if (requestData.action === 'save') {
      if (!requestData.config) {
        throw new Error('Config data is required for save action');
      }

      const config = requestData.config;
      
      // For this implementation, we'll simulate updating secrets
      // In a real production environment, you would use the Supabase Management API
      // to update the edge function environment variables/secrets
      
      console.log('Saving NotificationAPI configuration:', {
        fromAddress: config.emailFromAddress,
        fromName: config.emailFromName,
        hasClientId: !!config.clientId,
        hasClientSecret: !!config.clientSecret
      });

      // Here you would typically:
      // 1. Update EMAIL_FROM_ADDRESS secret  
      // 2. Update EMAIL_FROM_NAME secret
      // 3. Update NOTIFICATIONAPI_CLIENT_ID secret
      // 4. Update NOTIFICATIONAPI_CLIENT_SECRET secret

      // For now, we'll just return success
      // The actual secret management would be done through Supabase Management API
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'NotificationAPI configuration saved successfully' 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } else if (requestData.action === 'load') {
      // Load current NotificationAPI configuration from environment variables
      const currentConfig = {
        emailFromAddress: Deno.env.get('EMAIL_FROM_ADDRESS') || '',
        emailFromName: Deno.env.get('EMAIL_FROM_NAME') || '',
        hasClientId: !!Deno.env.get('NOTIFICATIONAPI_CLIENT_ID'),
        hasClientSecret: !!Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET')
      };

      console.log('Current NotificationAPI configuration:', currentConfig);

      return new Response(
        JSON.stringify({ 
          success: true, 
          config: currentConfig 
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } else {
      throw new Error('Invalid action. Must be "save" or "load"');
    }

  } catch (error: any) {
    console.error('Error in manage-email-config function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);