import React, { useState, useEffect } from 'react';
import { EmailDeliveryTracker, EmailDeliveryLog } from "../lib/emailConfig";
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmailData();
  }, [organizationId]);

  const loadEmailData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load recent logs and stats in parallel
      const [recentLogs, deliveryStats] = await Promise.all([
        EmailDeliveryTracker.getRecentLogs(organizationId, 50),
        EmailDeliveryTracker.getDeliveryStats(organizationId)
      ]);
      
      setLogs(recentLogs);
      setStats(deliveryStats);
    } catch (error) {
      console.error('Error loading email data:', error);
      setError("Kunne ikke laste e-postdata");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: EmailDeliveryLog['status']) => {
    switch (status) {
      case 'sent':
        return <Clock className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'opened':
        return <Mail className="w-4 h-4 text-green-600" />;
      case 'clicked':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'bounced':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusClass = (status: EmailDeliveryLog['status']) => {
    switch (status) {
      case 'sent':
        return 'bg-gray-100 text-gray-800';
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'bg-green-100 text-green-800';
      case 'bounced':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Laster e-poststatistikk...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border border-red-200">
        <div className="text-red-600">{error}</div>
        <button 
          onClick={loadEmailData}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  const totalEmails = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const successfulEmails = (stats.delivered || 0) + (stats.opened || 0) + (stats.clicked || 0);
  const successRate = totalEmails > 0 ? ((successfulEmails / totalEmails) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale e-poster</p>
              <p className="text-2xl font-bold">{totalEmails}</p>
            </div>
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suksessrate</p>
              <p className="text-2xl font-bold">{successRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Åpnet</p>
              <p className="text-2xl font-bold">{stats.opened || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Feilet</p>
              <p className="text-2xl font-bold">{(stats.bounced || 0) + (stats.failed || 0)}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Recent Email Logs */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Nylige e-poster</h3>
            <p className="text-sm text-gray-600">
              De siste 50 e-postene som er sendt fra organisasjonen
            </p>
          </div>
          <button 
            onClick={loadEmailData}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Oppdater'}
          </button>
        </div>
        
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Ingen e-poster funnet
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium">{log.recipient_email}</p>
                    <p className="text-sm text-gray-500">
                      {getEmailTypeText(log.email_type)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(log.status)}`}>
                    {getStatusText(log.status)}
                  </span>
                  <span className="text-sm text-gray-500">
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
      </div>
    </div>
  );
};