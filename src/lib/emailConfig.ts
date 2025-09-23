import { supabase } from "@/integrations/supabase/client";
import { UrlConfig, EmailBranding } from "./emailUrls";

export interface EmailSettings {
  organization_id: string;
  url_config: UrlConfig;
  branding: EmailBranding;
}

export interface EmailDeliveryLog {
  id: string;
  organization_id: string;
  member_id?: string;
  email_type: string;
  recipient_email: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
  tracking_id?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Email configuration management
export class EmailConfigManager {
  // Get complete email settings for organization
  static async getEmailSettings(organizationId: string): Promise<EmailSettings | null> {
    const { data, error } = await supabase
      .from('email_settings')
      .select('setting_key, setting_value')
      .eq('organization_id', organizationId)
      .in('setting_key', ['url_config', 'branding']);

    if (error) {
      console.error('Error fetching email settings:', error);
      return null;
    }

    const settings: Partial<EmailSettings> = { organization_id: organizationId };
    
    data?.forEach((item: any) => {
      if (item.setting_key === 'url_config') {
        settings.url_config = item.setting_value;
      } else if (item.setting_key === 'branding') {
        settings.branding = item.setting_value;
      }
    });

    return settings as EmailSettings;
  }

  // Update URL configuration
  static async updateUrlConfig(
    organizationId: string, 
    config: UrlConfig
  ): Promise<boolean> {
    const { error } = await supabase
      .from('email_settings')
      .upsert({
        organization_id: organizationId,
        setting_key: 'url_config',
        setting_value: config
      }, {
        onConflict: 'organization_id,setting_key'
      });

    if (error) {
      console.error('Error updating URL config:', error);
      return false;
    }

    return true;
  }

  // Update branding configuration
  static async updateBranding(
    organizationId: string, 
    branding: EmailBranding
  ): Promise<boolean> {
    const { error } = await supabase
      .from('email_settings')
      .upsert({
        organization_id: organizationId,
        setting_key: 'branding',
        setting_value: branding
      }, {
        onConflict: 'organization_id,setting_key'
      });

    if (error) {
      console.error('Error updating branding config:', error);
      return false;
    }

    return true;
  }

  // Test email configuration
  static async testEmailConfiguration(organizationId: string): Promise<boolean> {
    try {
      const settings = await this.getEmailSettings(organizationId);
      if (!settings) return false;

      // Test URL generation
      const testUrls = [
        settings.url_config.base_url + settings.url_config.login_path,
        settings.url_config.base_url + settings.url_config.reset_password_path,
        settings.url_config.base_url + settings.url_config.email_preferences_path
      ];

      // Validate all URLs
      return testUrls.every(url => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      });
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return false;
    }
  }
}

// Email delivery tracking
export class EmailDeliveryTracker {
  // Log email sent
  static async logEmailSent(
    organizationId: string,
    memberId: string | null,
    emailType: string,
    recipientEmail: string,
    metadata: Record<string, any> = {}
  ): Promise<string | null> {
    const trackingId = crypto.randomUUID();

    const { data, error } = await supabase
      .from('email_delivery_logs')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        email_type: emailType,
        recipient_email: recipientEmail,
        status: 'sent',
        tracking_id: trackingId,
        metadata: {
          ...metadata,
          sent_at: new Date().toISOString()
        }
      })
      .select('tracking_id')
      .single();

    if (error) {
      console.error('Error logging email sent:', error);
      return null;
    }

    return data?.tracking_id || null;
  }

  // Update email status
  static async updateEmailStatus(
    trackingId: string,
    status: EmailDeliveryLog['status'],
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    const updateData: any = { 
      status,
      metadata: metadata
    };

    // Set timestamp fields based on status
    const now = new Date().toISOString();
    switch (status) {
      case 'opened':
        updateData.opened_at = now;
        break;
      case 'clicked':
        updateData.clicked_at = now;
        break;
      case 'bounced':
        updateData.bounced_at = now;
        break;
    }

    const { error } = await supabase
      .from('email_delivery_logs')
      .update(updateData)
      .eq('tracking_id', trackingId);

    if (error) {
      console.error('Error updating email status:', error);
      return false;
    }

    return true;
  }

  // Get delivery statistics for organization
  static async getDeliveryStats(
    organizationId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Record<string, number>> {
    let query = supabase
      .from('email_delivery_logs')
      .select('status')
      .eq('organization_id', organizationId);

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching delivery stats:', error);
      return {};
    }

    // Count by status
    const stats: Record<string, number> = {};
    data?.forEach((log: any) => {
      stats[log.status] = (stats[log.status] || 0) + 1;
    });

    return stats;
  }

  // Get recent email logs
  static async getRecentLogs(
    organizationId: string,
    limit: number = 50
  ): Promise<EmailDeliveryLog[]> {
    const { data, error } = await supabase
      .from('email_delivery_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent logs:', error);
      return [];
    }

    return data || [];
  }
}

// Email template utilities
export const generateEmailTemplate = (
  content: string,
  branding: EmailBranding,
  urls: {
    unsubscribeUrl?: string;
    preferencesUrl?: string;
    logoUrl?: string;
  } = {}
): string => {
  const logoHtml = urls.logoUrl || branding.logo_url 
    ? `<img src="${urls.logoUrl || branding.logo_url}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;" />`
    : '';

  const unsubscribeHtml = urls.unsubscribeUrl 
    ? `<p style="font-size: 12px; color: #666; margin-top: 30px;">
         <a href="${urls.unsubscribeUrl}" style="color: #666;">Avmeld deg</a> | 
         <a href="${urls.preferencesUrl}" style="color: #666;">E-postinnstillinger</a>
       </p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>E-post fra AktivLogg</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${branding.header_color};">
          ${logoHtml}
        </div>
        
        <div style="margin-bottom: 30px;">
          ${content}
        </div>
        
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
          ${branding.footer_text}
          ${unsubscribeHtml}
        </div>
      </div>
      
      <!-- Tracking pixel -->
      <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
           style="display: none;" alt="" />
    </body>
    </html>
  `;
};