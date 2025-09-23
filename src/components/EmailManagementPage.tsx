import React, { useState, useEffect } from 'react';
import { EmailDeliveryStatus } from './EmailDeliveryStatus';
import { EmailConfigManager } from '../lib/emailConfig';
import { 
  generateLoginUrl, 
  generatePasswordResetUrl, 
  generateEmailPreferencesUrl,
  getOrganizationUrlConfig,
  getOrganizationBranding,
  UrlConfig,
  EmailBranding
} from '../lib/emailUrls';
import { Loader2, TestTube, BarChart3, Globe, Palette } from 'lucide-react';

interface EmailManagementPageProps {
  organizationId: string;
  organizationSlug: string;
}

export const EmailManagementPage: React.FC<EmailManagementPageProps> = ({ 
  organizationId, 
  organizationSlug 
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'config' | 'branding' | 'test'>('stats');
  const [loading, setLoading] = useState(false);
  const [urlConfig, setUrlConfig] = useState<UrlConfig | null>(null);
  const [branding, setBranding] = useState<EmailBranding | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, [organizationId]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const [config, brandingData] = await Promise.all([
        getOrganizationUrlConfig(organizationId),
        getOrganizationBranding(organizationId)
      ]);
      setUrlConfig(config);
      setBranding(brandingData);
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUrlConfig = async (newConfig: UrlConfig) => {
    try {
      setLoading(true);
      const success = await EmailConfigManager.updateUrlConfig(organizationId, newConfig);
      if (success) {
        setUrlConfig(newConfig);
        setTestResult('URL-konfigurasjonen er oppdatert');
      } else {
        setTestResult('Feil ved oppdatering av URL-konfigurasjon');
      }
    } catch (error) {
      console.error('Error updating URL config:', error);
      setTestResult('Feil ved oppdatering av URL-konfigurasjon');
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (newBranding: EmailBranding) => {
    try {
      setLoading(true);
      const success = await EmailConfigManager.updateBranding(organizationId, newBranding);
      if (success) {
        setBranding(newBranding);
        setTestResult('E-postdesign er oppdatert');
      } else {
        setTestResult('Feil ved oppdatering av e-postdesign');
      }
    } catch (error) {
      console.error('Error updating branding:', error);
      setTestResult('Feil ved oppdatering av e-postdesign');
    } finally {
      setLoading(false);
    }
  };

  const testEmailConfiguration = async () => {
    try {
      setLoading(true);
      setTestResult(null);

      if (!testEmail) {
        setTestResult('Vennligst skriv inn en e-postadresse');
        return;
      }

      // Test URL generation
      const loginUrl = generateLoginUrl(organizationSlug);
      const resetUrl = await generatePasswordResetUrl(organizationSlug);
      const prefsUrl = generateEmailPreferencesUrl(organizationSlug);

      // Test configuration
      const configTest = await EmailConfigManager.testEmailConfiguration(organizationId);

      setTestResult(`
        Test fullført:
        - Konfigurasjon: ${configTest ? 'OK' : 'Feil'}
        - Login URL: ${loginUrl}
        - Reset URL: ${resetUrl}
        - Innstillinger URL: ${prefsUrl}
      `);
    } catch (error) {
      console.error('Error testing email configuration:', error);
      setTestResult('Feil ved testing av e-postkonfigurasjon');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !urlConfig) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Laster e-postinnstillinger...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">E-posthåndtering</h1>
        <p className="text-gray-600">
          Administrer e-postinnstillinger, følg leveranser og konfigurer URL-er
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Statistikk
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'config' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Globe className="w-4 h-4 mr-2" />
          URL-konfigurasjon
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'branding' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Palette className="w-4 h-4 mr-2" />
          E-postdesign
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'test' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <TestTube className="w-4 h-4 mr-2" />
          Test
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'stats' && (
          <div className="p-6">
            <EmailDeliveryStatus organizationId={organizationId} />
          </div>
        )}

        {activeTab === 'config' && urlConfig && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">URL-konfigurasjon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Basis URL</label>
                <input
                  type="text"
                  value={urlConfig.base_url}
                  onChange={(e) => setUrlConfig({...urlConfig, base_url: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://yoursite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tilpasset domene</label>
                <input
                  type="text"
                  value={urlConfig.custom_domain || ''}
                  onChange={(e) => setUrlConfig({...urlConfig, custom_domain: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="custom.domain.com (valgfritt)"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable_tracking"
                  checked={urlConfig.enable_tracking}
                  onChange={(e) => setUrlConfig({...urlConfig, enable_tracking: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="enable_tracking" className="text-sm">
                  Aktiver e-postsporing
                </label>
              </div>
              <button
                onClick={() => updateUrlConfig(urlConfig)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lagre'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'branding' && branding && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">E-postdesign</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Header-farge</label>
                <input
                  type="color"
                  value={branding.header_color}
                  onChange={(e) => setBranding({...branding, header_color: e.target.value})}
                  className="w-full h-10 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bunntekst</label>
                <input
                  type="text"
                  value={branding.footer_text}
                  onChange={(e) => setBranding({...branding, footer_text: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="Organisasjonsnavn - Powered by AktivLogg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Logo URL</label>
                <input
                  type="text"
                  value={branding.logo_url || ''}
                  onChange={(e) => setBranding({...branding, logo_url: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://example.com/logo.png (valgfritt)"
                />
              </div>
              <button
                onClick={() => updateBranding(branding)}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lagre'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Test e-postkonfigurasjon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test e-postadresse</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="test@example.com"
                />
              </div>
              <button
                onClick={testEmailConfiguration}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TestTube className="w-4 h-4 mr-2" />}
                Test konfigurasjon
              </button>
              {testResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};