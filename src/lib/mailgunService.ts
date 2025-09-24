import { supabase } from '../integrations/supabase/client';

export interface EmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export async function sendMailgunEmail(emailData: EmailRequest): Promise<EmailResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('send-mailgun-email', {
      body: emailData
    });

    if (error) {
      throw new Error(error.message || 'Failed to invoke email function');
    }

    return data as EmailResponse;
  } catch (error: any) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email'
    };
  }
}

// Helper function for sending simple text emails
export async function sendSimpleEmail(
  to: string | string[], 
  subject: string, 
  text: string, 
  from?: string
): Promise<EmailResponse> {
  return sendMailgunEmail({
    to,
    subject,
    text,
    from
  });
}

// Helper function for sending HTML emails
export async function sendHtmlEmail(
  to: string | string[], 
  subject: string, 
  html: string, 
  text?: string, 
  from?: string
): Promise<EmailResponse> {
  return sendMailgunEmail({
    to,
    subject,
    html,
    text,
    from
  });
}