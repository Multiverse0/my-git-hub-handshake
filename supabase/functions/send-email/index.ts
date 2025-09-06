import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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

interface EmailProvider {
  apiKey: string
  fromEmail: string
  fromName: string
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

  subscription_change: {
    subject: (data: any) => `Abonnementsendring for ${data.organizationName}`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Abonnementsendring</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: #1F2937; margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
          .change-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Abonnementsendring</h1>
          </div>
          
          <div class="content">
            <h2>Hei Yngve!</h2>
            
            <p>En kunde har endret sitt abonnement i AKTIVLOGG-systemet:</p>
            
            <div class="change-box">
              <h3>📋 Endringsinformasjon:</h3>
              <p><strong>Organisasjon:</strong> ${data.organizationName}</p>
              <p><strong>Endring:</strong> ${data.changeType}</p>
              <p><strong>Fra:</strong> ${data.oldPlan} (Kr ${data.oldPrice}/mnd)</p>
              <p><strong>Til:</strong> ${data.newPlan} (Kr ${data.newPrice}/mnd)</p>
              <p><strong>Prisendring:</strong> ${data.newPrice > data.oldPrice ? '+' : ''}${data.newPrice - data.oldPrice} Kr/mnd</p>
            </div>
            
            <div class="change-box">
              <h3>📞 Kontaktinformasjon:</h3>
              <p><strong>Organisasjons-epost:</strong> ${data.organizationEmail}</p>
              <p><strong>Telefon:</strong> ${data.organizationPhone}</p>
              <p><strong>Faktura-epost:</strong> ${data.billingEmail}</p>
            </div>
            
            <p><strong>Neste steg:</strong></p>
            <ul>
              <li>Kontakt kunden for å bekrefte endringen</li>
              <li>Oppdater faktureringssystemet</li>
              <li>Send bekreftelse til kunden</li>
            </ul>
            
            <p>Endringen er registrert i systemet: ${new Date().toLocaleString('nb-NO')}</p>
            
            <p>Med vennlig hilsen,<br>
            <strong>AKTIVLOGG Automatisk System</strong></p>
          </div>
          
          <div class="footer">
            <p>Dette er en automatisk generert e-post fra AKTIVLOGG-systemet.</p>
            <p>© ${new Date().getFullYear()} AKTIVLOGG. Alle rettigheter reservert.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data: any) => `
Abonnementsendring for ${data.organizationName}

Hei Yngve!

En kunde har endret sitt abonnement i AKTIVLOGG-systemet:

ENDRINGSINFORMASJON:
Organisasjon: ${data.organizationName}
Endring: ${data.changeType}
Fra: ${data.oldPlan} (Kr ${data.oldPrice}/mnd)
Til: ${data.newPlan} (Kr ${data.newPrice}/mnd)
Prisendring: ${data.newPrice > data.oldPrice ? '+' : ''}${data.newPrice - data.oldPrice} Kr/mnd

KONTAKTINFORMASJON:
Organisasjons-epost: ${data.organizationEmail}
Telefon: ${data.organizationPhone}
Faktura-epost: ${data.billingEmail}

NESTE STEG:
- Kontakt kunden for å bekrefte endringen
- Oppdater faktureringssystemet
- Send bekreftelse til kunden

Endringen er registrert: ${new Date().toLocaleString('nb-NO')}

Med vennlig hilsen,
AKTIVLOGG Automatisk System
    `
  }
}

async function sendWithSendGrid(emailData: EmailRequest, provider: EmailProvider) {
  const template = templates[emailData.template]
  if (!template) {
    throw new Error(`Unknown email template: ${emailData.template}`)
  }

  const subject = template.subject(emailData.data)
  const htmlContent = template.html(emailData.data)
  const textContent = template.text(emailData.data)

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: emailData.to }],
        subject: subject
      }],
      from: {
        email: provider.fromEmail,
        name: provider.fromName
      },
      content: [
        {
          type: 'text/plain',
          value: textContent
        },
        {
          type: 'text/html',
          value: htmlContent
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid API error: ${response.status} - ${error}`)
  }

  return { success: true, provider: 'sendgrid' }
}

async function sendWithMailgun(emailData: EmailRequest, provider: EmailProvider) {
  const template = templates[emailData.template]
  if (!template) {
    throw new Error(`Unknown email template: ${emailData.template}`)
  }

  const subject = template.subject(emailData.data)
  const htmlContent = template.html(emailData.data)
  const textContent = template.text(emailData.data)

  // Extract domain from fromEmail
  const domain = provider.fromEmail.split('@')[1]
  
  const formData = new FormData()
  formData.append('from', `${provider.fromName} <${provider.fromEmail}>`)
  formData.append('to', emailData.to)
  formData.append('subject', subject)
  formData.append('text', textContent)
  formData.append('html', htmlContent)

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${provider.apiKey}`)}`
    },
    body: formData
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Mailgun API error: ${response.status} - ${error}`)
  }

  return { success: true, provider: 'mailgun' }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const emailData: EmailRequest = await req.json()
    
    // Handle test requests
    if (emailData.test) {
      // Get email provider configuration from environment
      const emailProvider: EmailProvider = {
        apiKey: Deno.env.get('EMAIL_API_KEY') || '',
        fromEmail: Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@aktivlogg.no',
        fromName: Deno.env.get('EMAIL_FROM_NAME') || 'Aktivlogg'
      }

      if (!emailProvider.apiKey) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Email service not configured. Missing EMAIL_API_KEY environment variable.' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const emailService = Deno.env.get('EMAIL_SERVICE') || 'sendgrid'
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Email configuration is valid',
          provider: emailService
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!emailData.to || !emailData.template || !emailData.data || !emailData.organizationId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, template, data, organizationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email provider configuration from environment or database
    // For now, we'll use environment variables
    const emailProvider: EmailProvider = {
      apiKey: Deno.env.get('EMAIL_API_KEY') || '',
      fromEmail: Deno.env.get('EMAIL_FROM_ADDRESS') || 'noreply@aktivlogg.no',
      fromName: Deno.env.get('EMAIL_FROM_NAME') || 'Aktivlogg'
    }

    if (!emailProvider.apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Email service not configured. Please set EMAIL_API_KEY environment variable.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine which email service to use based on API key format or environment
    const emailService = Deno.env.get('EMAIL_SERVICE') || 'sendgrid'
    
    let result
    try {
      if (emailService === 'mailgun') {
        result = await sendWithMailgun(emailData, emailProvider)
      } else {
        result = await sendWithSendGrid(emailData, emailProvider)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send email', 
          details: error.message 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log successful email send (you might want to store this in database)
    console.log(`Email sent successfully to ${emailData.to} using ${result.provider}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        provider: result.provider
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})