import { AlertCircle, ExternalLink, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface NotificationAPIGuideProps {
  config: {
    clientId: string;
    clientSecret: string;
    fromAddress: string;
    fromName: string;
  };
  onClose: () => void;
}

export function NotificationAPIGuide({ config, onClose }: NotificationAPIGuideProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const projectId = 'lwhrtzlpxgpmozrcxtrw'; // Your Supabase project ID
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectId}/settings/functions`;

  const secrets = [
    {
      name: 'NOTIFICATIONAPI_CLIENT_ID',
      value: config.clientId,
      description: 'Your NotificationAPI Client ID'
    },
    {
      name: 'NOTIFICATIONAPI_CLIENT_SECRET',
      value: config.clientSecret,
      description: 'Your NotificationAPI Client Secret',
      isSecret: true
    },
    {
      name: 'EMAIL_FROM_ADDRESS',
      value: config.fromAddress,
      description: 'Default sender email address'
    },
    {
      name: 'EMAIL_FROM_NAME',
      value: config.fromName,
      description: 'Default sender name'
    }
  ];

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">NotificationAPI Setup Required</h3>
              <p className="text-gray-400">Configure these secrets in your Supabase dashboard to enable email functionality</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">1</span>
                Open Supabase Dashboard
              </h4>
              <p className="text-gray-300 mb-3">
                Navigate to your project's edge function settings in the Supabase dashboard:
              </p>
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 underline"
              >
                <ExternalLink className="w-4 h-4" />
                Open Edge Function Settings
              </a>
            </div>

            {/* Step 2 */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">2</span>
                Add Environment Variables/Secrets
              </h4>
              <p className="text-gray-300 mb-4">
                In the edge function settings, add these environment variables:
              </p>

              <div className="space-y-3">
                {secrets.map((secret) => (
                  <div key={secret.name} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <code className="text-blue-300 font-mono text-sm">{secret.name}</code>
                        <p className="text-xs text-gray-400 mt-1">{secret.description}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(secret.value, secret.name)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded"
                        title="Copy to clipboard"
                      >
                        {copiedField === secret.name ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={secret.isSecret && !showSecret ? 'password' : 'text'}
                        value={secret.value}
                        readOnly
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm font-mono pr-10"
                      />
                      {secret.isSecret && (
                        <button
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="bg-blue-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center">3</span>
                Save and Test
              </h4>
              <p className="text-gray-300 mb-3">
                After adding all the environment variables:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 text-sm">
                <li>Save the settings in the Supabase dashboard</li>
                <li>Wait a few moments for the edge functions to restart</li>
                <li>Close this dialog and try the "Test Configuration" button</li>
                <li>Send a test email to verify everything works</li>
              </ul>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-400 mb-2">Important Notes:</h4>
              <ul className="list-disc list-inside text-yellow-200 space-y-1 text-sm">
                <li>Make sure you have a valid NotificationAPI account and project</li>
                <li>The Client ID and Secret must be from the same NotificationAPI project</li>
                <li>The email address should be verified in your NotificationAPI settings</li>
                <li>Changes may take a few moments to take effect</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="btn-primary"
            >
              I've configured the secrets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}