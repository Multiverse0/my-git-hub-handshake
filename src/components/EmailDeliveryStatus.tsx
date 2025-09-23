import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailDeliveryTracker, EmailDeliveryLog } from "@/lib/emailConfig";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

interface EmailDeliveryStatusProps {
  organizationId: string;
}

export const EmailDeliveryStatus: React.FC<EmailDeliveryStatusProps> = ({ 
  organizationId 
}) => {
  const [logs, setLogs] = useState<EmailDeliveryLog[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEmailData();
  }, [organizationId]);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      
      // Load recent logs and stats in parallel
      const [recentLogs, deliveryStats] = await Promise.all([
        EmailDeliveryTracker.getRecentLogs(organizationId, 50),
        EmailDeliveryTracker.getDeliveryStats(organizationId)
      ]);
      
      setLogs(recentLogs);
      setStats(deliveryStats);
    } catch (error) {
      console.error('Error loading email data:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste e-postdata",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: EmailDeliveryLog['status']) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case 'opened':
        return <Mail className="w-4 h-4 text-primary" />;
      case 'clicked':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case 'bounced':
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: EmailDeliveryLog['status']) => {
    switch (status) {
      case 'sent':
        return 'secondary';
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'default';
      case 'bounced':
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: EmailDeliveryLog['status']) => {
    const statusTexts: Record<string, string> = {
      sent: 'Sendt',
      delivered: 'Levert',
      opened: 'Åpnet',
      clicked: 'Klikket',
      bounced: 'Returnert',
      failed: 'Feilet'
    };
    return statusTexts[status] || status;
  };

  const getEmailTypeText = (emailType: string) => {
    const typeTexts: Record<string, string> = {
      password_reset: 'Passord reset',
      training_verification: 'Trenings bekreftelse',
      role_change: 'Rolle endring',
      admin_welcome: 'Admin velkommen',
      member_welcome: 'Medlem velkommen',
      account_suspended: 'Konto suspendert',
      organization_announcement: 'Organisasjons kunngjøring'
    };
    return typeTexts[emailType] || emailType;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Laster e-poststatistikk...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalEmails = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const successfulEmails = (stats.delivered || 0) + (stats.opened || 0) + (stats.clicked || 0);
  const successRate = totalEmails > 0 ? ((successfulEmails / totalEmails) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totale e-poster</p>
                <p className="text-2xl font-bold">{totalEmails}</p>
              </div>
              <Mail className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suksessrate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Åpnet</p>
                <p className="text-2xl font-bold">{stats.opened || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Feilet</p>
                <p className="text-2xl font-bold">{(stats.bounced || 0) + (stats.failed || 0)}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Nylige e-poster</CardTitle>
          <CardDescription>
            De siste 50 e-postene som er sendt fra organisasjonen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Ingen e-poster funnet
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-medium">{log.recipient_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {getEmailTypeText(log.email_type)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={getStatusColor(log.status)}>
                      {getStatusText(log.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString('no-NO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};