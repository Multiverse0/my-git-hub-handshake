import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Megaphone, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { sendOrganizationAnnouncementEmail } from '../lib/emailService';

interface BulkEmailSenderProps {
  organizationId: string;
  organizationName: string;
}

export function BulkEmailSender({ organizationId, organizationName }: BulkEmailSenderProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'members' | 'admins'>('all');
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      
      let query = supabase
        .from('organization_members')
        .select('id, email, full_name, role, active')
        .eq('organization_id', organizationId)
        .eq('approved', true)
        .eq('active', true);

      if (recipientType === 'members') {
        query = query.eq('role', 'member');
      } else if (recipientType === 'admins') {
        query = query.eq('role', 'admin');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setRecipients(data || []);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast.error('Feil ved lasting av mottakere');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const sendBulkEmail = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Tittel og innhold er påkrevd');
      return;
    }

    if (recipients.length === 0) {
      toast.error('Ingen mottakere funnet');
      return;
    }

    try {
      setSending(true);
      
      let successCount = 0;
      let failureCount = 0;

      // Send emails in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const promises = batch.map(async (recipient) => {
          try {
            // Check if user wants announcements (skip if disabled)
            const { data: preferences } = await supabase
              .from('email_preferences')
              .select('organization_announcements')
              .eq('member_id', recipient.id)
              .single();

            // Skip if user has disabled announcements
            if (preferences && !preferences.organization_announcements) {
              return { success: false, reason: 'disabled' };
            }

            const result = await sendOrganizationAnnouncementEmail(
              recipient.email,
              recipient.full_name,
              organizationName,
              organizationId,
              title,
              content
            );

            return result;
          } catch (error) {
            console.error(`Error sending to ${recipient.email}:`, error);
            return { success: false, error: (error as Error).message };
          }
        });

        const results = await Promise.all(promises);
        
        results.forEach(result => {
          if (result.success) {
            successCount++;
          } else {
            failureCount++;
          }
        });

        // Small delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (successCount > 0) {
        toast.success(`E-post sendt til ${successCount} mottakere${failureCount > 0 ? ` (${failureCount} feilet)` : ''}`);
      } else {
        toast.error('Ingen e-poster ble sendt');
      }

      // Clear form
      setTitle('');
      setContent('');
      setRecipients([]);

    } catch (error) {
      console.error('Error sending bulk email:', error);
      toast.error('Feil ved sending av e-post');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Send kunngjøring
        </CardTitle>
        <CardDescription>
          Send e-post til alle medlemmer i organisasjonen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient-type">Mottakere</Label>
          <Select
            value={recipientType}
            onValueChange={(value: 'all' | 'members' | 'admins') => {
              setRecipientType(value);
              setRecipients([]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle medlemmer</SelectItem>
              <SelectItem value="members">Kun vanlige medlemmer</SelectItem>
              <SelectItem value="admins">Kun administratorer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadRecipients}
            disabled={loadingRecipients}
            variant="outline"
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            {loadingRecipients ? 'Laster...' : 'Last mottakere'}
          </Button>
          {recipients.length > 0 && (
            <Badge variant="secondary">
              {recipients.length} mottaker{recipients.length !== 1 ? 'e' : ''}
            </Badge>
          )}
        </div>

        {recipients.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              placeholder="Skriv inn tittel på kunngjøringen"
            />
          </div>
        )}

        {recipients.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="content">Innhold</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Skriv inn innholdet i kunngjøringen..."
              rows={6}
            />
          </div>
        )}

        {recipients.length > 0 && (
          <div className="flex justify-end">
            <Button
              onClick={sendBulkEmail}
              disabled={sending || !title.trim() || !content.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sender...' : `Send til ${recipients.length} mottaker${recipients.length !== 1 ? 'e' : ''}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}