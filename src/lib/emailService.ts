import { sendCombinedNotification, sendTemplateNotification } from './notificationApiService';

export interface EmailData {
  to: string;
  phoneNumber?: string;
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
 * Send email using NotificationAPI (supports combined email + SMS)
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  try {
    console.log('📧 Sending notification via NotificationAPI:', {
      to: emailData.to,
      template: emailData.template,
      organizationId: emailData.organizationId,
      hasPhone: !!emailData.phoneNumber
    });

    const subject = getEmailSubject(emailData.template, emailData.data);
    const htmlContent = generateEmailContent(emailData.template, emailData.data);
    const smsContent = emailData.phoneNumber ? generateSMSContent(emailData.template, emailData.data) : undefined;
    
    const notificationResult = await sendCombinedNotification(
      { 
        id: emailData.to, 
        email: emailData.to,
        number: emailData.phoneNumber
      },
      subject,
      htmlContent,
      smsContent
    );

    if (notificationResult.success) {
      console.log('✅ Notification sent successfully via NotificationAPI');
      return {
        success: true,
        provider: 'notificationapi',
        messageId: notificationResult.messageId
      };
    }

    console.error('❌ NotificationAPI failed:', notificationResult.error);
    return {
      success: false,
      error: notificationResult.error || 'Failed to send notification via NotificationAPI'
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
  loginUrl: string,
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: adminEmail,
    phoneNumber,
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
 * Send welcome email to new member using NotificationAPI template
 */
export async function sendMemberWelcomeEmail(
  memberEmail: string,
  memberName: string,
  organizationName: string,
  _organizationId: string, // Keep for API compatibility but prefix with _ to indicate unused
  memberNumber?: string,
  phoneNumber?: string
): Promise<EmailResult> {
  try {
    console.log('📧 Sending welcome email to new member via template:', { 
      email: memberEmail, 
      memberName, 
      organizationName, 
      hasPhoneNumber: !!phoneNumber 
    });
    
    // Use NotificationAPI template with proper parameters
    const templateParameters = {
      organizationName: organizationName || 'AKTIVLOGG',
      recipientName: memberName || 'New Member',
      email: memberEmail,
      loginUrl: `${window.location.origin}/login`,
      adminName: 'Admin',
      memberNumber: memberNumber || 'AUTO-ASSIGNED',
      password: 'Your login credentials will be provided separately'
    };

    const result = await sendTemplateNotification(
      {
        id: memberEmail,
        email: memberEmail,
        number: phoneNumber
      },
      'welcome_aktiv',
      templateParameters
    );

    return {
      success: result.success,
      error: result.error,
      provider: 'NotificationAPI',
      messageId: result.messageId
    };

  } catch (error: any) {
    console.error('❌ Error sending member welcome email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email',
      provider: 'NotificationAPI'
    };
  }
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
  adminName: string,
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  },
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  },
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  loginUrl: string,
  phoneNumber?: string
): Promise<EmailResult> {
  const roleLabels = {
    'admin': 'Administrator',
    'range_officer': 'Baneleder',
    'member': 'Medlem'
  };

  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  organizationId: string,
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  suspensionReason?: string,
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
  announcementContent: string,
  phoneNumber?: string
): Promise<EmailResult> {
  return sendEmail({
    to: memberEmail,
    phoneNumber,
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
    
    const notificationResult = await sendCombinedNotification(
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
  // Add safety checks for data properties
  const safeData = {
    recipientName: data?.recipientName || 'User',
    organizationName: data?.organizationName || 'AKTIVLOGG',
    email: data?.email || '',
    password: data?.password || '',
    loginUrl: data?.loginUrl || '#',
    memberNumber: data?.memberNumber || '',
    adminName: data?.adminName || 'Administrator',
    trainingDate: data?.trainingDate || '',
    duration: data?.duration || 0,
    discipline: data?.discipline || '',
    verifiedBy: data?.verifiedBy || '',
    notes: data?.notes || '',
    rejectionReason: data?.rejectionReason || '',
    newRole: data?.newRole || '',
    changeTime: data?.changeTime || new Date().toLocaleString('no-NO'),
    suspensionReason: data?.suspensionReason || '',
    announcementTitle: data?.announcementTitle || 'Announcement',
    announcementContent: data?.announcementContent || 'No content provided',
    ...data
  };

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

  const buttonStyle = `
    background-color: #FFD700;
    color: #1F2937;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 5px;
    display: inline-block;
    font-weight: bold;
    margin: 10px 0;
  `;

  const templates = {
    'welcome_admin': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Welcome Administrator</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>You have been granted administrator access to ${safeData.organizationName}.</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li>Email: ${safeData.email}</li>
            <li>Password: ${safeData.password}</li>
          </ul>
          <p><a href="${safeData.loginUrl}" style="${buttonStyle}">Login to Dashboard</a></p>
        </div>
      </div>
    `,
    'welcome_member': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Welcome to ${safeData.organizationName}</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Thank you for registering with ${safeData.organizationName}. Your membership application has been received and is currently under review.</p>
          ${safeData.memberNumber ? `<p><strong>Member Number:</strong> ${safeData.memberNumber}</p>` : ''}
          <p>You will receive a confirmation email once your membership has been approved by an administrator.</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'member_approved': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Membership Approved!</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Great news! Your membership application for ${safeData.organizationName} has been approved by ${safeData.adminName}.</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li>Email: ${safeData.email}</li>
            <li>Password: ${safeData.password}</li>
          </ul>
          <p><a href="${safeData.loginUrl}" style="${buttonStyle}">Login to Your Account</a></p>
          <p>Welcome to ${safeData.organizationName}!</p>
        </div>
      </div>
    `,
    'training_verified': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Training Session Verified</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Your training session has been verified:</p>
          <ul>
            <li><strong>Date:</strong> ${safeData.trainingDate}</li>
            <li><strong>Duration:</strong> ${safeData.duration} minutes</li>
            <li><strong>Discipline:</strong> ${safeData.discipline}</li>
            <li><strong>Verified by:</strong> ${safeData.verifiedBy}</li>
            ${safeData.notes ? `<li><strong>Notes:</strong> ${safeData.notes}</li>` : ''}
          </ul>
          <p>Keep up the great work!</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'training_rejected': `
      <div style="${baseStyle}">
        <div style="${headerStyle}" style="background-color: #FEE2E2; color: #DC2626;">
          <h1>Training Session Rejected</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Unfortunately, your training session has been rejected:</p>
          <ul>
            <li><strong>Date:</strong> ${safeData.trainingDate}</li>
            <li><strong>Duration:</strong> ${safeData.duration} minutes</li>
            <li><strong>Discipline:</strong> ${safeData.discipline}</li>
            <li><strong>Reviewed by:</strong> ${safeData.verifiedBy}</li>
            ${safeData.rejectionReason ? `<li><strong>Reason:</strong> ${safeData.rejectionReason}</li>` : ''}
          </ul>
          <p>Please contact your administrator if you have questions about this decision.</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'role_updated': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Role Updated</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Your role in ${safeData.organizationName} has been updated to <strong>${safeData.newRole}</strong>.</p>
          <p>Your new permissions are now active. Please log in to see your updated access.</p>
          <p><a href="${safeData.loginUrl}" style="${buttonStyle}">Login to Your Account</a></p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'password_changed': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Password Changed</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Your password for ${safeData.organizationName} was successfully changed on ${safeData.changeTime}.</p>
          <p>If you did not make this change, please contact your administrator immediately.</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'account_suspended': `
      <div style="${baseStyle}">
        <div style="${headerStyle}" style="background-color: #FEE2E2; color: #DC2626;">
          <h1>Account Suspended</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>Your account with ${safeData.organizationName} has been suspended.</p>
          ${safeData.suspensionReason ? `<p><strong>Reason:</strong> ${safeData.suspensionReason}</p>` : ''}
          <p>Please contact your administrator for more information.</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'organization_announcement': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>${safeData.announcementTitle}</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <div style="margin: 20px 0;">
            ${(safeData.announcementContent || '').replace(/\n/g, '<br/>')}
          </div>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `,
    'password_reset': `
      <div style="${baseStyle}">
        <div style="${headerStyle}">
          <h1>Password Reset</h1>
        </div>
        <div style="${contentStyle}">
          <p>Hello ${safeData.recipientName},</p>
          <p>You have requested a password reset for your ${safeData.organizationName} account.</p>
          <p><a href="${safeData.loginUrl}" style="${buttonStyle}">Reset Your Password</a></p>
          <p>If you did not request this reset, please ignore this email.</p>
          <p>Best regards,<br/>${safeData.organizationName}</p>
        </div>
      </div>
    `
  };

  return templates[template as keyof typeof templates] || `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1>${safeData.organizationName}</h1>
      </div>
      <div style="${contentStyle}">
        <p>Hello ${safeData.recipientName},</p>
        <p>You have received a notification from ${safeData.organizationName}.</p>
      </div>
    </div>
  `;
}

// Generate SMS content for notifications
function generateSMSContent(template: EmailData['template'], data: any): string {
  // Add safety checks for data properties
  const safeData = {
    recipientName: data?.recipientName || 'User',
    organizationName: data?.organizationName || 'AKTIVLOGG',
    email: data?.email || '',
    loginUrl: data?.loginUrl || '',
    trainingDate: data?.trainingDate || '',
    duration: data?.duration || 0,
    discipline: data?.discipline || '',
    newRole: data?.newRole || '',
    changeTime: data?.changeTime || new Date().toLocaleString('no-NO'),
    announcementTitle: data?.announcementTitle || 'Announcement',
    ...data
  };

  const smsTemplates = {
    'welcome_admin': `${safeData.organizationName}: Du har fått administrator tilgang. Logg inn med ${safeData.email}`,
    'welcome_member': `${safeData.organizationName}: Takk for registrering! Din medlemskap er under vurdering.`,
    'member_approved': `${safeData.organizationName}: Medlemskap godkjent! Logg inn med ${safeData.email} på ${safeData.loginUrl}`,
    'training_verified': `${safeData.organizationName}: Treningsøkt godkjent! ${safeData.trainingDate}, ${safeData.duration} min, ${safeData.discipline}`,
    'training_rejected': `${safeData.organizationName}: Treningsøkt avvist. ${safeData.trainingDate}, ${safeData.discipline}. Kontakt administrator.`,
    'role_updated': `${safeData.organizationName}: Din rolle er oppdatert til ${safeData.newRole}. Logg inn for å se nye tilganger.`,
    'password_changed': `${safeData.organizationName}: Passordet ditt ble endret ${safeData.changeTime}. Kontakt administrator hvis dette ikke var deg.`,
    'account_suspended': `${safeData.organizationName}: Din konto er suspendert. Kontakt administrator for mer informasjon.`,
    'organization_announcement': `${safeData.organizationName}: ${safeData.announcementTitle}`,
    'password_reset': `${safeData.organizationName}: Passord reset forespurt. Bruk lenken i eposten for å tilbakestille.`
  };

  return smsTemplates[template] || `${safeData.organizationName}: Du har mottatt en notifikasjon.`;
}