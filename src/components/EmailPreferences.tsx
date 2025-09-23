import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Switch } from '@radix-ui/react-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Bell, Mail, Shield, Megaphone } from 'lucide-react';
import { toast } from 'sonner';

interface EmailPreferences {
  training_notifications: boolean;
  role_change_notifications: boolean;
  password_notifications: boolean;
  organization_announcements: boolean;
}

export function EmailPreferences() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    training_notifications: true,
    role_change_notifications: true,
    password_notifications: true,
    organization_announcements: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      
      // Get current user's member ID
      const userEmail = (await supabase.auth.getUser()).data.user?.email;
      if (!userEmail) return;

      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (!member) return;
      
      setMemberId(member.id);

      // Load email preferences
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('member_id', member.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          training_notifications: data.training_notifications,
          role_change_notifications: data.role_change_notifications,
          password_notifications: data.password_notifications,
          organization_announcements: data.organization_announcements
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!memberId) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          member_id: memberId,
          ...preferences
        });

      if (error) {
        throw error;
      }

      toast.success('E-postinnstillinger lagret');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Feil ved lagring av innstillinger');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            E-postinnstillinger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Laster innstillinger...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          E-postinnstillinger
        </CardTitle>
        <CardDescription>
          Velg hvilke e-postvarsler du ønsker å motta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Treningsvarsler</p>
                <p className="text-sm text-muted-foreground">
                  Varsler når trening blir godkjent eller avvist
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.training_notifications}
              onCheckedChange={(checked) => updatePreference('training_notifications', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Rolleendringer</p>
                <p className="text-sm text-muted-foreground">
                  Varsler når din rolle endres
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.role_change_notifications}
              onCheckedChange={(checked) => updatePreference('role_change_notifications', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Sikkerhetsvarsler</p>
                <p className="text-sm text-muted-foreground">
                  Viktige sikkerhetsvarsler (kan ikke skrus av)
                </p>
              </div>
            </div>
            <Switch
              checked={true}
              disabled={true}
              className="data-[state=checked]:bg-primary opacity-50"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Organisasjonskunngjøringer</p>
                <p className="text-sm text-muted-foreground">
                  Generelle kunngjøringer fra din organisasjon
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.organization_announcements}
              onCheckedChange={(checked) => updatePreference('organization_announcements', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={savePreferences} 
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Lagrer...' : 'Lagre innstillinger'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}