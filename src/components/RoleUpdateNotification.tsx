import { useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

export function RoleUpdateNotification() {
  const { user, refreshUserData } = useAuth();

  useEffect(() => {
    if (!user?.member_profile?.id) return;

    // Subscribe to role update notifications
    const channel = supabase
      .channel('role-notifications')
      .on(
        'broadcast',
        { event: 'role_updated' },
        (payload) => {
          if (payload.payload.memberId === user.member_profile?.id) {
            const newRole = payload.payload.newRole;
            
            // Show appropriate toast notification
            const roleLabels = {
              'admin': 'Administrator',
              'range_officer': 'Baneleder',
              'member': 'Medlem'
            };

            const roleIcons = {
              'admin': <ShieldCheck className="h-4 w-4" />,
              'range_officer': <Shield className="h-4 w-4" />,
              'member': <ShieldOff className="h-4 w-4" />
            };

            toast.success(
              `Din rolle er oppdatert til ${roleLabels[newRole as keyof typeof roleLabels]}`,
              {
                description: 'Dine tilganger er oppdatert automatisk',
                icon: roleIcons[newRole as keyof typeof roleIcons],
                duration: 5000
              }
            );

            // Refresh user data to get updated permissions
            setTimeout(() => {
              refreshUserData();
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.member_profile?.id, refreshUserData]);

  return null; // This component doesn't render anything visible
}