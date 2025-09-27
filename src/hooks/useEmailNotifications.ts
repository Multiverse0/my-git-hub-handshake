import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { 
  sendTrainingVerificationEmail, 
  sendRoleUpdateEmail,
  sendAccountSuspensionEmail
} from '../lib/emailService';
import { sendSMSNotification } from '../lib/notificationApiService';

export function useEmailNotifications() {
  useEffect(() => {
    // Listen for training session updates
    const trainingChannel = supabase
      .channel('training-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'member_training_sessions',
          filter: 'verified=eq.true'
        },
        async (payload) => {
          const session = payload.new;
          const oldSession = payload.old;
          
          // Only send email if verification status changed
          if (session.verified !== oldSession.verified && session.verified) {
            await handleTrainingVerified(session);
          }
        }
      )
      .subscribe();

    // Listen for role changes
    const roleChannel = supabase
      .channel('role-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organization_members',
          filter: 'role=neq.null'
        },
        async (payload) => {
          const member = payload.new;
          const oldMember = payload.old;
          
          // Only send email if role changed
          if (member.role !== oldMember.role) {
            await handleRoleChanged(member, oldMember.role);
          }
        }
      )
      .subscribe();

    // Listen for member status changes
    const statusChannel = supabase
      .channel('status-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'organization_members',
          filter: 'active=neq.null'
        },
        async (payload) => {
          const member = payload.new;
          const oldMember = payload.old;
          
          // Only send email if status changed to inactive
          if (member.active !== oldMember.active && !member.active) {
            await handleAccountSuspended(member);
          }
        }
      )
      .subscribe();

    return () => {
      trainingChannel.unsubscribe();
      roleChannel.unsubscribe();
      statusChannel.unsubscribe();
    };
  }, []);

  const handleTrainingVerified = async (session: any) => {
    try {
      // Check user's email and SMS preferences
      const preferences = await getUserEmailPreferences(session.member_id);
      if (!preferences?.training_notifications && !preferences?.sms_training_notifications) return;

      // Get member and organization details
      const { data: member } = await supabase
        .from('organization_members')
        .select('email, full_name, organization_id, phone_number')
        .eq('id', session.member_id)
        .single();

      if (!member) return;

      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', member.organization_id)
        .single();

      if (!org) return;

      // Send email notification if enabled
      if (preferences?.training_notifications) {
        await sendTrainingVerificationEmail(
          member.email,
          member.full_name,
          org.name,
          member.organization_id,
          {
            trainingDate: new Date(session.start_time).toLocaleDateString('no-NO'),
            duration: session.duration_minutes || 0,
            discipline: session.discipline || 'Ukjent',
            verifiedBy: session.verified_by || 'Administrator',
            notes: session.notes
          }
        );
      }

      // Send SMS notification if enabled and phone number available
      if (preferences?.sms_training_notifications && member.phone_number) {
        const smsMessage = `${org.name}: Din treningsøkt er godkjent! Dato: ${new Date(session.start_time).toLocaleDateString('no-NO')}, Varighet: ${session.duration_minutes || 0} min, Disiplin: ${session.discipline || 'Ukjent'}`;
        
        await sendSMSNotification(
          {
            id: member.email,
            email: member.email,
            number: member.phone_number
          },
          smsMessage
        );
      }
    } catch (error) {
      console.error('Error sending training verification notifications:', error);
    }
  };

  const handleRoleChanged = async (member: any, _oldRole: string) => {
    try {
      // Check user's email and SMS preferences
      const preferences = await getUserEmailPreferences(member.id);
      if (!preferences?.role_change_notifications && !preferences?.sms_role_change_notifications) return;

      // Get organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('name, slug')
        .eq('id', member.organization_id)
        .single();

      if (!org) return;

      const loginUrl = `${window.location.origin}/login?org=${org.slug}`;

      // Send email notification if enabled
      if (preferences?.role_change_notifications) {
        await sendRoleUpdateEmail(
          member.email,
          member.full_name,
          org.name,
          member.organization_id,
          member.role,
          loginUrl
        );
      }

      // Send SMS notification if enabled and phone number available
      if (preferences?.sms_role_change_notifications && member.phone_number) {
        const roleLabels = {
          'admin': 'Administrator',
          'range_officer': 'Baneleder',
          'member': 'Medlem'
        };
        const roleName = roleLabels[member.role as keyof typeof roleLabels] || member.role;
        const smsMessage = `${org.name}: Din rolle har blitt oppdatert til ${roleName}. Logg inn på ${loginUrl}`;
        
        await sendSMSNotification(
          {
            id: member.email,
            email: member.email,
            number: member.phone_number
          },
          smsMessage
        );
      }
    } catch (error) {
      console.error('Error sending role update notifications:', error);
    }
  };

  const handleAccountSuspended = async (member: any) => {
    try {
      // Always send account suspension emails (security notification)
      
      // Get organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', member.organization_id)
        .single();

      if (!org) return;

      await sendAccountSuspensionEmail(
        member.email,
        member.full_name,
        org.name,
        member.organization_id
      );
    } catch (error) {
      console.error('Error sending account suspension email:', error);
    }
  };

  const getUserEmailPreferences = async (memberId: string) => {
    try {
      const { data } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('member_id', memberId)
        .single();

      // Return defaults if no preferences found
      return data || {
        training_notifications: true,
        role_change_notifications: true,
        password_notifications: true,
        organization_announcements: true,
        sms_notifications: false,
        sms_training_notifications: false,
        sms_role_change_notifications: false,
        sms_organization_announcements: false
      };
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      return {
        training_notifications: true,
        role_change_notifications: true,
        password_notifications: true,
        organization_announcements: true,
        sms_notifications: false,
        sms_training_notifications: false,
        sms_role_change_notifications: false,
        sms_organization_announcements: false
      };
    }
  };
}