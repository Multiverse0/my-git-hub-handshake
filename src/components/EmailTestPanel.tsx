import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2, Send, Settings } from 'lucide-react';
import { testEmailConfiguration, sendEmail } from '../lib/emailService';

export function EmailTestPanel() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string; provider?: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const handleTestConfiguration = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const result = await testEmailConfiguration();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setTestResult({
        success: false,
        error: 'Vennligst skriv inn en e-postadresse'
      });
      return;
    }

    setSendingTest(true);
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
        error: error instanceof Error ? error.message : 'Test failed'
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <Mail className="w-5 h-5" />
        E-post Konfigurasjon & Testing
      </h3>

      <div className="space-y-6">
        {/* Configuration Status */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h4 className="font-medium text-blue-400 mb-3">📧 E-post Service Status</h4>
          <div className="space-y-2 text-sm text-blue-200">
            <p><strong>Service:</strong> Supabase Edge Functions + SendGrid/Mailgun</p>
            <p><strong>Templates:</strong> Welcome Admin, Welcome Member, Member Approved</p>
            <p><strong>Features:</strong> HTML + Text, Responsive Design, Error Handling</p>
          </div>
        </div>

        {/* Environment Variables Info */}
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h4 className="font-medium text-yellow-400 mb-3">⚙️ Påkrevde Environment Variables</h4>
          <div className="space-y-1 text-sm text-yellow-200 font-mono">
            <p>EMAIL_API_KEY=your_sendgrid_or_mailgun_api_key</p>
            <p>EMAIL_SERVICE=sendgrid (eller mailgun)</p>
            <p>EMAIL_FROM_ADDRESS=noreply@yourdomain.com</p>
            <p>EMAIL_FROM_NAME=Your Organization Name</p>
          </div>
          <p className="text-xs text-yellow-300 mt-2">
            Disse må settes i Supabase Dashboard → Edge Functions → Environment Variables
          </p>
        </div>

        {/* Test Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Test E-post Konfigurasjon</h4>
            <button
              onClick={handleTestConfiguration}
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

          {/* Send Test Email */}
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="flex-1 bg-gray-700 rounded-md px-3 py-2"
            />
            <button
              onClick={handleSendTestEmail}
              className="btn-primary"
              disabled={sendingTest || !testEmail}
            >
              {sendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sender...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test E-post
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Results */}
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
              <div className="text-sm text-green-200">
                <p>✅ E-post service er konfigurert og fungerer</p>
                {testResult.provider && (
                  <p>📧 Provider: {testResult.provider}</p>
                )}
              </div>
            ) : (
              <div className="text-sm text-red-200">
                <p>❌ {testResult.error}</p>
                <p className="mt-2 text-xs">
                  Sjekk at environment variables er satt korrekt i Supabase Dashboard.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-gray-700/50 rounded-lg p-4">
          <h4 className="font-medium mb-3">🚀 Setup Instruksjoner</h4>
          <ol className="text-sm space-y-2 list-decimal list-inside text-gray-300">
            <li>Opprett konto hos SendGrid eller Mailgun</li>
            <li>Generer API-nøkkel fra din e-post-leverandør</li>
            <li>Gå til Supabase Dashboard → Edge Functions → Environment Variables</li>
            <li>Legg til de påkrevde environment variables</li>
            <li>Deploy Edge Function: <code className="bg-gray-600 px-1 rounded">supabase functions deploy send-email</code></li>
            <li>Test konfigurasjonen med knappene over</li>
          </ol>
        </div>
      </div>
    </div>
  );
}