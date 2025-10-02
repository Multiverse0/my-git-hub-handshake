import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  email: string;
  organizationName?: string;
  organizationLogo?: string;
  resetUrl: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, organizationName, organizationLogo, resetUrl }: ResetPasswordRequest = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    console.log('Processing password reset request for:', email);

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate password reset link using Supabase Admin
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: resetUrl
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      throw new Error(`Failed to generate reset link: ${resetError.message}`);
    }

    if (!resetData?.properties?.action_link) {
      throw new Error('No reset link generated');
    }

    const resetLink = resetData.properties.action_link;
    console.log('Reset link generated successfully');

    // Send email via send-notification-direct edge function
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${organizationLogo ? `
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="${organizationLogo}" alt="${organizationName}" style="max-width: 200px; height: auto;">
            </div>
          ` : ''}
          
          <h1 style="color: #2563eb; margin-bottom: 20px;">Tilbakestill passord</h1>
          
          <p>Hei,</p>
          
          <p>Du har bedt om å tilbakestille passordet ditt for ${organizationName || 'AKTIVLOGG'}.</p>
          
          <p>Klikk på knappen nedenfor for å opprette et nytt passord:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Tilbakestill passord
            </a>
          </div>
          
          <p>Eller kopier og lim inn denne lenken i nettleseren din:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-size: 12px;">
            ${resetLink}
          </p>
          
          <p style="color: #dc2626; margin-top: 20px;">
            <strong>Viktig:</strong> Denne lenken utløper om 60 minutter av sikkerhetshensyn.
          </p>
          
          <p>Hvis du ikke ba om å tilbakestille passordet, kan du ignorere denne e-posten.</p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #6b7280;">
            Med vennlig hilsen,<br>
            ${organizationName || 'AKTIVLOGG'} Team
          </p>
        </body>
      </html>
    `;

    const notificationPayload = {
      to: {
        id: email,
        email: email
      },
      email: {
        subject: `${organizationName || 'AKTIVLOGG'} - Tilbakestill passord`,
        html: emailHtml
      }
    };

    // Call send-notification-direct function internally
    const { data: notificationResult, error: notificationError } = await supabaseAdmin.functions.invoke(
      'send-notification-direct',
      {
        body: notificationPayload
      }
    );

    // Handle invoke-level errors (network, timeout, etc.)
    if (notificationError) {
      console.error('Error invoking send-notification-direct:', notificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not send email. Please try again in a few minutes.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Handle provider-level errors (both NotificationAPI and Resend failed)
    if (!notificationResult?.success) {
      console.error('send-notification-direct failed:', notificationResult);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not send email. Please try again in a few minutes.',
          details: notificationResult?.error
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('✅ Email sent successfully via', notificationResult.provider);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        messageId: notificationResult.messageId,
        provider: notificationResult.provider
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in reset-password function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Could not process password reset. Please try again in a few minutes.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
