import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

interface EmailRequest {
  to: string
  subject: string
  template: 'welcome_admin' | 'welcome_member' | 'member_approved' | 'password_reset'
  data: {
    organizationName: string
    recipientName: string
    loginUrl?: string
    email?: string
    password?: string
    memberNumber?: string
    adminName?: string
    [key: string]: any
  }
  organizationId: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Email templates
const templates = {
  welcome_admin: {
    subject: (data: any) => `Velkommen som administrator for ${data.organizationName}`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Velkommen som administrator</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #1F2937; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .button { display: inline-block; background: #FFD700; color: #1F2937; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Velkommen som Administrator!</h1>
          </div>
          
          <div class="content">
            <h2>Hei ${data.recipientName}!</h2>
            
            <p>Du har blitt opprettet som administrator for <strong>${data.organizationName}</strong> i Aktivlogg-systemet.</p>
            
            <div class="credentials">
              <h3>🔐 Dine innloggingsopplysninger:</h3>
              <p><strong>E-post:</strong> ${data.email}</p>
              <p><strong>Passord:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Viktig sikkerhetsinformasjon:</strong>
              <ul>
                <li>Endre passordet ditt ved første innlogging</li>
                <li>Del aldri innloggingsopplysningene med andre</li>
                <li>Logg ut når du er ferdig med å bruke systemet</li>
              </ul>
            </div>
            
            <p>Som administrator kan du:</p>
            <ul>
              <li>✅ Godkjenne nye medlemmer</li>
              <li>✅ Verifisere treningsøkter</li>
              <li>✅ Administrere medlemslister</li>
              <li>✅ Generere rapporter og statistikk</li>
              <li>✅ Konfigurere organisasjonsinnstillinger</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">🚀 Logg inn nå</a>
            </div>
            
            <p>Hvis du har spørsmål eller trenger hjelp, ikke nøl med å ta kontakt med oss.</p>
            
            <p>Velkommen til teamet!</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>Aktivlogg Support Team</strong></p>
          </div>
          
          <div class="footer">
            <p>Dette er en automatisk generert e-post fra Aktivlogg-systemet.</p>
            <p>Hvis du ikke skulle mottatt denne e-posten, vennligst ignorer den.</p>
            <p>© ${new Date().getFullYear()} Aktivlogg. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: any) => `
Velkommen som administrator for ${data.organizationName}!

Hei ${data.recipientName}!

Du har blitt opprettet som administrator for ${data.organizationName} i Aktivlogg-systemet.

Dine innloggingsopplysninger:
E-post: ${data.email}
Passord: ${data.password}

VIKTIG: Endre passordet ditt ved første innlogging!

Logg inn her: ${data.loginUrl}

Som administrator kan du:
- Godkjenne nye medlemmer
- Verifisere treningsøkter  
- Administrere medlemslister
- Generere rapporter og statistikk
- Konfigurere organisasjonsinnstillinger

Velkommen til teamet!

Med vennlig hilsen,
Aktivlogg Support Team
    `
  },

  welcome_member: {
    subject: (data: any) => `Velkommen til ${data.organizationName}!`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Velkommen som medlem</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #1F2937; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .button { display: inline-block; background: #FFD700; color: #1F2937; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
          .pending { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Velkommen til ${data.organizationName}!</h1>
          </div>
          
          <div class="content">
            <h2>Hei ${data.recipientName}!</h2>
            
            <p>Takk for at du har registrert deg som medlem i <strong>${data.organizationName}</strong>!</p>
            
            <div class="pending">
              <h3>⏳ Din registrering venter på godkjenning</h3>
              <p>En administrator vil gjennomgå og godkjenne medlemskapet ditt snart. Du vil motta en ny e-post når kontoen din er aktivert.</p>
            </div>
            
            <div class="info-box">
              <h3>📋 Dine registrerte opplysninger:</h3>
              <p><strong>Navn:</strong> ${data.recipientName}</p>
              <p><strong>E-post:</strong> ${data.email}</p>
              ${data.memberNumber ? `<p><strong>Medlemsnummer:</strong> ${data.memberNumber}</p>` : ''}
            </div>
            
            <p>Når medlemskapet ditt er godkjent, kan du:</p>
            <ul>
              <li>🎯 Registrere treningsøkter ved å skanne QR-koder</li>
              <li>📊 Se oversikt over dine treninger</li>
              <li>📄 Laste ned treningslogg som PDF</li>
              <li>👤 Administrere din profil</li>
            </ul>
            
            <p>Vi gleder oss til å ha deg som medlem!</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>${data.organizationName}</strong></p>
          </div>
          
          <div class="footer">
            <p>Dette er en automatisk generert e-post fra Aktivlogg-systemet.</p>
            <p>Hvis du ikke registrerte deg, vennligst ignorer denne e-posten.</p>
            <p>© ${new Date().getFullYear()} Aktivlogg. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: any) => `
Velkommen til ${data.organizationName}!

Hei ${data.recipientName}!

Takk for at du har registrert deg som medlem i ${data.organizationName}!

Din registrering venter på godkjenning fra en administrator. Du vil motta en ny e-post når kontoen din er aktivert.

Dine registrerte opplysninger:
- Navn: ${data.recipientName}
- E-post: ${data.email}
${data.memberNumber ? `- Medlemsnummer: ${data.memberNumber}` : ''}

Når medlemskapet ditt er godkjent, kan du:
- Registrere treningsøkter ved å skanne QR-koder
- Se oversikt over dine treninger  
- Laste ned treningslogg som PDF
- Administrere din profil

Vi gleder oss til å ha deg som medlem!

Med vennlig hilsen,
${data.organizationName}
    `
  },

  member_approved: {
    subject: (data: any) => `Medlemskap godkjent - Velkommen til ${data.organizationName}!`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medlemskap godkjent</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .success-box { background: #d1fae5; border: 1px solid #10B981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
          .button { display: inline-block; background: #10B981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Medlemskap Godkjent!</h1>
          </div>
          
          <div class="content">
            <h2>Gratulerer, ${data.recipientName}!</h2>
            
            <div class="success-box">
              <h3>✅ Ditt medlemskap i ${data.organizationName} er nå godkjent!</h3>
              <p>Du kan nå logge inn og begynne å bruke systemet.</p>
            </div>
            
            <div class="credentials">
              <h3>🔐 Dine innloggingsopplysninger:</h3>
              <p><strong>E-post:</strong> ${data.email}</p>
              <p><strong>Passord:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
            </div>
            
            <p>Godkjent av: <strong>${data.adminName}</strong></p>
            
            <p>Du kan nå:</p>
            <ul>
              <li>🎯 Registrere treningsøkter ved å skanne QR-koder</li>
              <li>📊 Se oversikt over dine treninger</li>
              <li>📄 Laste ned treningslogg som PDF</li>
              <li>👤 Administrere din profil</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">🚀 Logg inn nå</a>
            </div>
            
            <p>Velkommen til ${data.organizationName}!</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>${data.organizationName}</strong></p>
          </div>
          
          <div class="footer">
            <p>Dette er en automatisk generert e-post fra Aktivlogg-systemet.</p>
            <p>© ${new Date().getFullYear()} Aktivlogg. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: any) => `
Medlemskap godkjent - Velkommen til ${data.organizationName}!

Gratulerer, ${data.recipientName}!

Ditt medlemskap i ${data.organizationName} er nå godkjent!

Dine innloggingsopplysninger:
E-post: ${data.email}
Passord: ${data.password}

Godkjent av: ${data.adminName}

Du kan nå:
- Registrere treningsøkter ved å skanne QR-koder
- Se oversikt over dine treninger
- Laste ned treningslogg som PDF  
- Administrere din profil

Logg inn her: ${data.loginUrl}

Velkommen til ${data.organizationName}!

Med vennlig hilsen,
${data.organizationName}
    `
  },

  password_reset: {
    subject: (data: any) => `Tilbakestill passord for ${data.organizationName}`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tilbakestill passord</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Tilbakestill Passord</h1>
          </div>
          
          <div class="content">
            <h2>Hei ${data.recipientName}!</h2>
            
            <p>Du har bedt om å tilbakestille passordet ditt for <strong>${data.organizationName}</strong>.</p>
            
            <div class="info-box">
              <h3>🔑 Ditt nye passord:</h3>
              <p><strong>E-post:</strong> ${data.email}</p>
              <p><strong>Nytt passord:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.password}</code></p>
            </div>
            
            <p><strong>⚠️ Viktig:</strong> Endre dette passordet så snart du logger inn av sikkerhetsmessige årsaker.</p>
            
            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="button">🚀 Logg inn nå</a>
            </div>
            
            <p>Hvis du ikke ba om denne passordtilbakestillingen, kan du trygt ignorere denne e-posten.</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>${data.organizationName}</strong></p>
          </div>
          
          <div class="footer">
            <p>Dette er en automatisk generert e-post fra Aktivlogg-systemet.</p>
            <p>© ${new Date().getFullYear()} Aktivlogg. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: any) => `
Tilbakestill passord for ${data.organizationName}

Hei ${data.recipientName}!

Du har bedt om å tilbakestille passordet ditt for ${data.organizationName}.

Dine nye innloggingsopplysninger:
E-post: ${data.email}
Nytt passord: ${data.password}

VIKTIG: Endre dette passordet så snart du logger inn av sikkerhetsmessige årsaker.

Logg inn her: ${data.loginUrl}

Hvis du ikke ba om denne passordtilbakestillingen, kan du trygt ignorere denne e-posten.

Med vennlig hilsen,
${data.organizationName}
    `
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send email function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured. RESEND_API_KEY is missing.' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('RESEND_API_KEY found, initializing Resend client');
    const resend = new Resend(resendApiKey);

    const emailData: EmailRequest = await req.json();
    console.log('Email request received:', {
      to: emailData.to,
      template: emailData.template,
      organizationId: emailData.organizationId
    });

    // Validate required fields
    if (!emailData.to || !emailData.template || !emailData.data) {
      console.error('Missing required fields in email request');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: to, template, and data are required' 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get the template
    const template = templates[emailData.template];
    if (!template) {
      console.error('Unknown email template:', emailData.template);
      return new Response(
        JSON.stringify({ 
          error: `Unknown email template: ${emailData.template}` 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate email content
    const subject = template.subject(emailData.data);
    const htmlContent = template.html(emailData.data);
    const textContent = template.text(emailData.data);

    console.log('Sending email with Resend:', {
      to: emailData.to,
      subject: subject,
      from: 'Aktivlogg <noreply@aktivlogg.no>'
    });

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'Aktivlogg <noreply@aktivlogg.no>',
      to: [emailData.to],
      subject: subject,
      html: htmlContent,
      text: textContent
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id,
        message: 'Email sent successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    
    // Handle specific Resend errors
    if (error.message?.includes('API key')) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid RESEND API key. Please check your configuration.' 
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email: ' + error.message 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);