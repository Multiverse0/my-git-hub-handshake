import { supabase } from './supabase';

export interface EmailData {
  to: string;
  template: 'welcome_admin' | 'welcome_member' | 'member_approved' | 'password_reset' | 'training_verified' | 'training_rejected' | 'role_updated' | 'password_changed' | 'account_suspended' | 'organization_announcement';
  data: {
    organizationName: string;
    recipientName: string;
    loginUrl?: string;
    email?: string;
    password?: string;
    memberNumber?: string;
    adminName?: string;
    trainingDate?: string;
    duration?: number;
    discipline?: string;
    verifiedBy?: string;
    notes?: string;
    rejectionReason?: string;
    newRole?: string;
    changeTime?: string;
    suspensionReason?: string;
    announcementTitle?: string;
    announcementContent?: string;
    [key: string]: any;
  };
  organizationId: string;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  provider?: string;
}

/**
 * Send email using Supabase Edge Function
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  try {
    console.log('📧 Sending email:', {
      to: emailData.to,
      template: emailData.template,
      organizationId: emailData.organizationId
    });

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }

    // Handle response from Edge Function
    if (data && typeof data === 'object') {
      if (data.success === false) {
        console.error('❌ Email service error:', data.error);
        return {
          success: false,
          error: data.error || 'Email service error'
        };
      }
    }

    console.log('✅ Email sent successfully:', data);
    return {
      success: true,
      provider: data?.provider
    };

  } catch (error) {
    console.error('❌ Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send welcome email to new admin
 */
export async function sendAdminWelcomeEmail(
  adminEmail: string,
  adminName: string,
  organizationName: string,
  organizationId: string,
  password: string,
  loginUrl: string
): Promise<EmailResult> {
  return sendEmail({
    to: adminEmail,
    template: 'welcome_admin',
    data: {
      organizationName,
      recipientName: adminName,
      email: adminEmail,
      password,
      loginUrl
    },
    organizationId
  });
}

/**
 * Send welcome email to new member (pending approval)
 */
export async function sendMemberWelcomeEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  memberNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'welcome_member',
    data: {
      organizationName,
      recipientName: memberName,
      email: memberEmail,
      memberNumber
    },
    organizationId
  });
}

/**
 * Send approval email to member
 */
export async function sendMemberApprovalEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  password: string,
  loginUrl: string,
  adminName: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'member_approved',
    data: {
      organizationName,
      recipientName: memberName,
      email: memberEmail,
      password,
      loginUrl,
      adminName
    },
    organizationId
  });
}

/**
 * Send training verification email to member
 */
export async function sendTrainingVerificationEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  trainingDetails: {
    trainingDate: string;
    duration: number;
    discipline: string;
    verifiedBy: string;
    notes?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'training_verified',
    data: {
      organizationName,
      recipientName: memberName,
      ...trainingDetails
    },
    organizationId
  });
}

/**
 * Send training rejection email to member
 */
export async function sendTrainingRejectionEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  trainingDetails: {
    trainingDate: string;
    duration: number;
    discipline: string;
    verifiedBy: string;
    rejectionReason?: string;
  }
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'training_rejected',
    data: {
      organizationName,
      recipientName: memberName,
      ...trainingDetails
    },
    organizationId
  });
}

/**
 * Send role update email to member
 */
export async function sendRoleUpdateEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  newRole: string,
  loginUrl: string
): Promise<EmailResult> {
  const roleLabels = {
    'admin': 'Administrator',
    'range_officer': 'Baneleder',
    'member': 'Medlem'
  };

  return sendEmail({
    to: memberEmail,
    template: 'role_updated',
    data: {
      organizationName,
      recipientName: memberName,
      newRole: roleLabels[newRole as keyof typeof roleLabels] || newRole,
      loginUrl
    },
    organizationId
  });
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeConfirmationEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'password_changed',
    data: {
      organizationName,
      recipientName: memberName,
      changeTime: new Date().toLocaleString('no-NO')
    },
    organizationId
  });
}

/**
 * Send account suspension email
 */
export async function sendAccountSuspensionEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  suspensionReason?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'account_suspended',
    data: {
      organizationName,
      recipientName: memberName,
      suspensionReason
    },
    organizationId
  });
}

/**
 * Send organization announcement email
 */
export async function sendOrganizationAnnouncementEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  organizationId: string,
  announcementTitle: string,
  announcementContent: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    template: 'organization_announcement',
    data: {
      organizationName,
      recipientName: memberName,
      announcementTitle,
      announcementContent
    },
    organizationId
  });
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate login URL for organization
 */
export function generateLoginUrl(organizationSlug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/login?org=${organizationSlug}`;
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<EmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'test@example.com',
        template: 'welcome_admin',
        data: {
          organizationName: 'Test Organization',
          recipientName: 'Test User',
          email: 'test@example.com',
          password: 'test123',
          loginUrl: 'https://example.com/login'
        },
        organizationId: 'test-org',
        test: true // Special flag for testing
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Test failed'
      };
    }

    // Handle response from Edge Function
    if (data && typeof data === 'object') {
      return {
        success: data.success || false,
        error: data.error,
        provider: data.provider
      };
    }

    return {
      success: true,
      provider: data?.provider
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    };
  }
}