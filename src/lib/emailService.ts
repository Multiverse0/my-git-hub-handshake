import { sendEmailNotification } from './notificationApiService';

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
  messageId?: string;
  smsResult?: {
    success: boolean;
    error?: string;
  };
}

/**
 * Send email using NotificationAPI
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  try {
    console.log('📧 Sending email via NotificationAPI:', {
      to: emailData.to,
      template: emailData.template,
      organizationId: emailData.organizationId
    });

    const subject = getEmailSubject(emailData.template, emailData.data);
    const htmlContent = generateEmailContent(emailData.template, emailData.data);
    
    const notificationResult = await sendEmailNotification(
      { id: emailData.to, email: emailData.to },
      subject,
      htmlContent
    );

    if (notificationResult.success) {
      console.log('✅ Email sent successfully via NotificationAPI');
      return {
        success: true,
        provider: 'notificationapi',
        messageId: notificationResult.messageId
      };
    }

    console.error('❌ NotificationAPI failed:', notificationResult.error);
    return {
      success: false,
      error: notificationResult.error || 'Failed to send email via NotificationAPI'
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
 * Test email configuration (NotificationAPI only)
 */
export async function testEmailConfiguration(): Promise<EmailResult> {
  try {
    console.log('🧪 Testing NotificationAPI configuration...');
    
    const notificationResult = await sendEmailNotification(
      { id: 'test@example.com', email: 'test@example.com' },
      'Test Email - AKTIVLOGG',
      '<h1>Test Email</h1><p>This is a test email from AKTIVLOGG using NotificationAPI.</p>'
    );

    if (notificationResult.success) {
      console.log('✅ NotificationAPI test successful');
      return {
        success: true,
        provider: 'notificationapi',
        messageId: notificationResult.messageId
      };
    }

    console.error('❌ NotificationAPI test failed:', notificationResult.error);
    return {
      success: false,
      error: notificationResult.error || 'NotificationAPI test failed'
    };
  } catch (error) {
    console.error('❌ Email configuration test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    };
  }
}

// Helper functions for email content generation
function getEmailSubject(template: EmailData['template'], data: any): string {
  const subjects = {
    'welcome_admin': `Welcome to ${data.organizationName} - Administrator Access`,
    'welcome_member': `Welcome to ${data.organizationName}`,
    'member_approved': `Your ${data.organizationName} membership has been approved`,
    'password_reset': `Password Reset - ${data.organizationName}`,
    'training_verified': `Training Session Verified - ${data.organizationName}`,
    'training_rejected': `Training Session Rejected - ${data.organizationName}`,
    'role_updated': `Your role has been updated - ${data.organizationName}`,
    'password_changed': `Password Changed - ${data.organizationName}`,
    'account_suspended': `Account Suspended - ${data.organizationName}`,
    'organization_announcement': `${data.announcementTitle} - ${data.organizationName}`
  };
  return subjects[template] || `Notification from ${data.organizationName}`;
}

function generateEmailContent(template: EmailData['template'], data: any): string {
  const baseStyle = `
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const headerStyle = `
    background-color: #FFD700;
    color: #1F2937;
    padding: 20px;
    text-align: center;
    margin-bottom: 20px;
  `;

  const contentStyle = `
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 5px;
  `;

  const templates = {
    'welcome_admin': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Welcome Administrator</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${data.recipientName},</p>
          <p>You have been granted administrator access to ${data.organizationName}.</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li>Email: ${data.email}</li>
            <li>Password: ${data.password}</li>
          </ul>
          <p><a href="${data.loginUrl}" style="background-color: #FFD700; color: #1F2937; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login to Dashboard</a></p>
        </div>
      </div>
    `,
    'training_verified': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Training Session Verified</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${data.recipientName},</p>
          <p>Your training session has been verified:</p>
          <ul>
            <li>Date: ${data.trainingDate}</li>
            <li>Duration: ${data.duration} minutes</li>
            <li>Discipline: ${data.discipline}</li>
            <li>Verified by: ${data.verifiedBy}</li>
            ${data.notes ? `<li>Notes: ${data.notes}</li>` : ''}
          </ul>
        </div>
      </div>
    `,
    // Add more templates as needed
  };

  return templates[template as keyof typeof templates] || `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1>${data.organizationName}</h1>
      </div>
      <div style="${contentStyle}">
        <p>Hello ${data.recipientName},</p>
        <p>You have received a notification from ${data.organizationName}.</p>
      </div>
    </div>
  `;
}