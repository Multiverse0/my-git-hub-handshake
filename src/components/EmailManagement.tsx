import { useState, useEffect } from 'react';
import { Mail, Save, TestTube, Settings, Edit3, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { testEmailConfiguration, sendEmail } from '../lib/emailService';
import { supabase } from '../integrations/supabase/client';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

interface EmailConfig {
  clientId: string;
  clientSecret: string;
  fromAddress: string;
  fromName: string;
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'welcome_admin',
    name: 'Velkommen Administrator',
    subject: 'Velkommen som administrator for {{organizationName}}',
    content: `Hei {{recipientName}}!

Du har blitt opprettet som administrator for {{organizationName}} i Aktivlogg-systemet.

Dine innloggingsopplysninger:
E-post: {{email}}
Passord: {{password}}

VIKTIG: Endre passordet ditt ved første innlogging!

Som administrator kan du:
• Godkjenne nye medlemmer
• Verifisere treningsøkter
• Administrere medlemslister
• Generere rapporter og statistikk
• Konfigurere organisasjonsinnstillinger

Logg inn her: {{loginUrl}}

Velkommen til teamet!

Med vennlig hilsen,
{{organizationName}}`,
    variables: ['organizationName', 'recipientName', 'email', 'password', 'loginUrl']
  },
  {
    id: 'welcome_member',
    name: 'Velkommen Medlem',
    subject: 'Velkommen til {{organizationName}}!',
    content: `Hei {{recipientName}}!

Takk for at du har registrert deg som medlem i {{organizationName}}!

Din registrering venter på godkjenning fra en administrator. Du vil motta en ny e-post når kontoen din er aktivert.

Dine registrerte opplysninger:
• Navn: {{recipientName}}
• E-post: {{email}}
{{#memberNumber}}• Medlemsnummer: {{memberNumber}}{{/memberNumber}}

Når medlemskapet ditt er godkjent, kan du:
• Registrere treningsøkter ved å skanne QR-koder
• Se oversikt over dine treninger
• Laste ned treningslogg som PDF
• Administrere din profil

Vi gleder oss til å ha deg som medlem!

Med vennlig hilsen,
{{organizationName}}`,
    variables: ['organizationName', 'recipientName', 'email', 'memberNumber']
  },
  {
    id: 'member_approved',
    name: 'Medlem Godkjent',
    subject: 'Medlemskap godkjent - Velkommen til {{organizationName}}!',
    content: `Gratulerer, {{recipientName}}!

Ditt medlemskap i {{organizationName}} er nå godkjent!

Dine innloggingsopplysninger:
E-post: {{email}}
Passord: {{password}}

Godkjent av: {{adminName}}

Du kan nå:
• Registrere treningsøkter ved å skanne QR-koder
• Se oversikt over dine treninger
• Laste ned treningslogg som PDF
• Administrere din profil

Logg inn her: {{loginUrl}}

Velkommen til {{organizationName}}!

Med vennlig hilsen,
{{organizationName}}`,
    variables: ['organizationName', 'recipientName', 'email', 'password', 'loginUrl', 'adminName']
  }
];

export function EmailManagement() {
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'test'>('config');
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    clientId: '',
    clientSecret: '',
    fromAddress: '',
    fromName: ''
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadEmailSettings();
  }, []);

  // Load email configuration from Supabase secrets  
  const loadEmailSettings = async () => {
    try {
      // In a real implementation, we would need to create an edge function to retrieve secrets
      // For now, keep using localStorage as fallback until the edge function is implemented
      const savedConfig = localStorage.getItem('emailConfig');
      if (savedConfig) {
        setEmailConfig(JSON.parse(savedConfig));
      }

      const savedTemplates = localStorage.getItem('emailTemplates');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error('Failed to load email settings:', error);
    }
  };

  const saveEmailConfig = async () => {
    setSaving(true);
    try {
      // Save to Supabase edge function to update secrets
      const { error } = await supabase.functions.invoke('manage-email-config', {
        body: {
          action: 'save',
          config: {
            emailFromAddress: emailConfig.fromAddress,
            emailFromName: emailConfig.fromName,
            clientId: emailConfig.clientId,
            clientSecret: emailConfig.clientSecret
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Also save to localStorage as backup
      localStorage.setItem('emailConfig', JSON.stringify(emailConfig));
      
      console.log('📧 NotificationAPI config saved to Supabase secrets:', {
        fromAddress: emailConfig.fromAddress,
        fromName: emailConfig.fromName,
        hasClientId: !!emailConfig.clientId,
        hasClientSecret: !!emailConfig.clientSecret
      });

      setTestResult({ success: true });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error: any) {
      console.error('Failed to save email config:', error);
      setTestResult({ success: false, error: error.message || 'Kunne ikke lagre konfigurasjon' });
    } finally {
      setSaving(false);
    }
  };

  const saveTemplates = async () => {
    setSaving(true);
    try {
      localStorage.setItem('emailTemplates', JSON.stringify(templates));
      setTestResult({ success: true });
      setTimeout(() => setTestResult(null), 3000);
    } catch (error) {
      setTestResult({ success: false, error: 'Kunne ikke lagre maler' });
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (templateId: string, field: 'subject' | 'content', value: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, [field]: value }
        : template
    ));
  };

  const testEmailConfig = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await testEmailConfiguration();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test feilet'
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, error: 'Vennligst skriv inn en e-postadresse' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await sendEmail({
        to: testEmail,
        template: 'welcome_admin',
        data: {
          organizationName: 'Test Organisasjon',
          recipientName: 'Test Bruker',
          email: testEmail,
          password: 'test123456',
          loginUrl: `${window.location.origin}/login?org=test`
        },
        organizationId: 'test-org'
      });

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test feilet'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold theme-primary-text mb-2">NotificationAPI Administrasjon</h2>
        <p className="text-gray-400">Konfigurer NotificationAPI og rediger meldingsmaler</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'config'
              ? 'theme-primary-text border-b-2 theme-primary-border'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Konfigurasjon
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'templates'
              ? 'theme-primary-text border-b-2 theme-primary-border'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Edit3 className="w-4 h-4 inline mr-2" />
          E-post Maler
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'test'
              ? 'theme-primary-text border-b-2 theme-primary-border'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TestTube className="w-4 h-4 inline mr-2" />
          Test E-post
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="card space-y-6">
          <h3 className="text-lg font-semibold">NotificationAPI Konfigurasjon</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client ID *
              </label>
              <input
                type="text"
                value={emailConfig.clientId}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, clientId: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="NotificationAPI Client ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Secret *
              </label>
              <div className="relative">
                <input
                  type={showClientSecret ? 'text' : 'password'}
                  value={emailConfig.clientSecret}
                  onChange={(e) => setEmailConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 pr-10"
                  placeholder="NotificationAPI Client Secret"
                />
                <button
                  type="button"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avsender E-post *
              </label>
              <input
                type="email"
                value={emailConfig.fromAddress}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, fromAddress: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="noreply@klubbnavn.no"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Avsender Navn *
              </label>
              <input
                type="text"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="Klubbnavn"
              />
            </div>
          </div>

          {/* Current Service Status */}
          <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
            <h4 className="font-medium text-gray-300 mb-3">📊 Gjeldende NotificationAPI Konfigurasjon</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Client ID:</span>
                <span className={`font-medium ${emailConfig.clientId ? 'text-green-400' : 'text-red-400'}`}>
                  {emailConfig.clientId ? '✓ Konfigurert' : '✗ Mangler'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Client Secret:</span>
                <span className={`font-medium ${emailConfig.clientSecret ? 'text-green-400' : 'text-red-400'}`}>
                  {emailConfig.clientSecret ? '✓ Konfigurert' : '✗ Mangler'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avsender E-post:</span>
                <span className="font-medium text-white">{emailConfig.fromAddress || 'Ikke satt'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avsender Navn:</span>
                <span className="font-medium text-white">{emailConfig.fromName || 'Ikke satt'}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">📋 NotificationAPI Setup Instruksjoner</h4>
            <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
              <li>Logg inn på NotificationAPI dashboard</li>
              <li>Kopier Client ID og Client Secret fra prosjektinnstillingene</li>
              <li>Fyll inn konfigurasjon over</li>
              <li>Klikk "Lagre Konfigurasjon"</li>
              <li>Test at alt fungerer i "Test E-post" fanen</li>
            </ol>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveEmailConfig}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lagre Konfigurasjon
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {templates.map((template) => (
            <div key={template.id} className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <button
                  onClick={() => setEditingTemplate(editingTemplate === template.id ? null : template.id)}
                  className="btn-secondary"
                >
                  <Edit3 className="w-4 h-4" />
                  {editingTemplate === template.id ? 'Lukk' : 'Rediger'}
                </button>
              </div>

              {editingTemplate === template.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emne
                    </label>
                    <input
                      type="text"
                      value={template.subject}
                      onChange={(e) => updateTemplate(template.id, 'subject', e.target.value)}
                      className="w-full bg-gray-700 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Innhold
                    </label>
                    <textarea
                      value={template.content}
                      onChange={(e) => updateTemplate(template.id, 'content', e.target.value)}
                      className="w-full bg-gray-700 rounded-md px-3 py-2 h-64 font-mono text-sm"
                    />
                  </div>

                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Tilgjengelige Variabler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {template.variables.map((variable) => (
                        <code key={variable} className="bg-gray-600 px-2 py-1 rounded text-xs">
                          {`{{${variable}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p><strong>Emne:</strong> {template.subject}</p>
                  <p><strong>Variabler:</strong> {template.variables.join(', ')}</p>
                </div>
              )}
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={saveTemplates}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Lagre Maler
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="card space-y-6">
          <h3 className="text-lg font-semibold">Test E-post Funksjonalitet</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Test Konfigurasjon</h4>
              <button
                onClick={testEmailConfig}
                className="btn-secondary"
                disabled={testing}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tester...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Test Konfigurasjon
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 bg-gray-700 rounded-md px-3 py-2"
              />
              <button
                onClick={sendTestEmail}
                className="btn-primary"
                disabled={testing || !testEmail}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sender...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Test E-post
                  </>
                )}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testResult.success 
                ? 'bg-green-900/20 border-green-700' 
                : 'bg-red-900/20 border-red-700'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${
                  testResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {testResult.success ? 'Test Vellykket!' : 'Test Feilet'}
                </span>
              </div>
              
              {testResult.success ? (
                <p className="text-sm text-green-200">
                  ✅ E-post tjeneste er konfigurert og fungerer
                </p>
              ) : (
                <p className="text-sm text-red-200">
                  ❌ {testResult.error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}