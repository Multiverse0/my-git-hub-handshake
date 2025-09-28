import { supabase } from '../integrations/supabase/client';

export interface NotificationRequest {
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

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendNotificationAPI(
  notificationData: NotificationRequest
): Promise<NotificationResult> {
  try {
    console.log('Sending notification via NotificationAPI:', {
      type: notificationData.type,
      to: notificationData.to.email,
      hasEmail: !!notificationData.email,
      hasSMS: !!notificationData.sms
    });

    const { data, error } = await supabase.functions.invoke('send-notification-direct', {
        body: notificationData
      });

      console.log('📡 NotificationAPI response:', { data, error });

      if (error) {
        console.error('❌ NotificationAPI function error:', error);
        throw new Error(error.message || 'Failed to invoke notification function');
      }

      if (!data?.success) {
        console.error('❌ NotificationAPI send failed:', data);
        return {
          success: false,
          error: data?.error || 'Failed to send notification'
        };
      }

      console.log('✅ NotificationAPI send successful:', data);
    return {
      success: true,
      messageId: data.messageId
    };

  } catch (error: any) {
    console.error('Error in sendNotificationAPI:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification'
    };
  }
}

// Helper function for sending template-based notifications
export async function sendTemplateNotification(
  to: { id: string; email: string; number?: string },
  templateId: string,
  parameters: Record<string, any>
): Promise<NotificationResult> {
  return sendNotificationAPI({
    type: 'aktivlogg',
    to,
    templateId,
    parameters
  });
}

// Helper function for sending simple email notifications (deprecated - use template instead)
export async function sendEmailNotification(
  to: { id: string; email: string },
  subject: string,
  html: string
): Promise<NotificationResult> {
  return sendNotificationAPI({
    type: 'aktivlogg',
    to,
    email: {
      subject,
      html
    }
  });
}

// Helper function for sending SMS notifications
export async function sendSMSNotification(
  to: { id: string; email: string; number: string },
  message: string
): Promise<NotificationResult> {
  return sendNotificationAPI({
    type: 'aktivlogg',
    to,
    sms: {
      message
    }
  });
}

// Helper function for sending combined email + SMS notifications
export async function sendCombinedNotification(
  to: { id: string; email: string; number?: string },
  emailSubject: string,
  emailHtml: string,
  smsMessage?: string
): Promise<NotificationResult> {
  const payload: NotificationRequest = {
    type: 'aktivlogg',
    to,
    email: {
      subject: emailSubject,
      html: emailHtml
    }
  };

  // Only add SMS if phone number and message are provided
  if (to.number && smsMessage) {
    payload.sms = {
      message: smsMessage
    };
  }

  return sendNotificationAPI(payload);
}