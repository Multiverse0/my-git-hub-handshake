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
  console.log('📧 Manage email config function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ConfigRequest = await req.json();
    console.log('📋 Config request:', { action: requestData.action });

    if (requestData.action === 'save') {
      if (!requestData.config) {
        throw new Error('Config data is required for save action');
      }

      const config = requestData.config;
      
      console.log('💾 Received NotificationAPI configuration to save:', {
        fromAddress: config.emailFromAddress,
        fromName: config.emailFromName,
        hasClientId: !!config.clientId,
        hasClientSecret: !!config.clientSecret,
        clientIdLength: config.clientId?.length || 0,
        clientSecretLength: config.clientSecret?.length || 0
      });

      // Check current environment variables to see if they're already configured
      const currentClientId = Deno.env.get('NOTIFICATIONAPI_CLIENT_ID');
      const currentClientSecret = Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET');
      const currentFromAddress = Deno.env.get('EMAIL_FROM_ADDRESS');
      const currentFromName = Deno.env.get('EMAIL_FROM_NAME');

      console.log('🔍 Current Supabase secrets status:', {
        hasClientId: !!currentClientId,
        hasClientSecret: !!currentClientSecret,
        hasFromAddress: !!currentFromAddress,
        hasFromName: !!currentFromName
      });

      // Since we can't programmatically update Supabase secrets from edge functions,
      // we need to guide the user to do it manually through the dashboard
      const needsManualSetup = !currentClientId || !currentClientSecret || 
                               currentClientId !== config.clientId || 
                               currentClientSecret !== config.clientSecret ||
                               currentFromAddress !== config.emailFromAddress ||
                               currentFromName !== config.emailFromName;

      if (needsManualSetup) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Manual Supabase secrets configuration required',
            instructions: {
              message: 'Please update the following secrets in your Supabase project dashboard:',
              secrets: [
                { name: 'NOTIFICATIONAPI_CLIENT_ID', value: config.clientId },
                { name: 'NOTIFICATIONAPI_CLIENT_SECRET', value: '••••••••' },
                { name: 'EMAIL_FROM_ADDRESS', value: config.emailFromAddress },
                { name: 'EMAIL_FROM_NAME', value: config.emailFromName }
              ],
              dashboardUrl: `https://supabase.com/dashboard/project/${Deno.env.get('SUPABASE_PROJECT_ID') || 'YOUR_PROJECT_ID'}/settings/functions`
            }
          }),
          {
            status: 200, // Success status but with manual action required
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'NotificationAPI configuration is already correctly set in Supabase secrets' 
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
        hasClientSecret: !!Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET'),
        clientId: Deno.env.get('NOTIFICATIONAPI_CLIENT_ID') || '',
        // Don't return the actual secret for security
        clientSecretMask: Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET') ? 
          '••••••••' + Deno.env.get('NOTIFICATIONAPI_CLIENT_SECRET')!.slice(-4) : ''
      };

      console.log('📋 Current NotificationAPI configuration:', {
        ...currentConfig,
        clientSecretMask: currentConfig.clientSecretMask
      });

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
    console.error('❌ Error in manage-email-config function:', error);
    
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