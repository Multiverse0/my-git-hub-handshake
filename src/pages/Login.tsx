```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth from your project's context
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react"; // Import icons for better UI

export function Login() {
  const navigate = useNavigate();
  const { login, branding } = useAuth(); // Use the login function from AuthContext

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vennligst fyll ut alle felt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Call the login function from AuthContext
      // The rememberMe and orgSlug parameters are optional, depending on your Login page's full requirements
      await login(email, password, false, 'svpk'); // Assuming 'svpk' as default org slug for demo

      // After successful login, DashboardRouter will handle the role-based redirection
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : 'Det oppstod en feil ved innlogging');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          {/* You can keep your organization logo/branding here */}
          <h1
            className="text-2xl font-bold"
            style={{ color: branding.primary_color }}
          >
            Logg inn
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Logg inn til {branding.organization_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-4 pr-4 py-2"
                placeholder="navn@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-4 pr-12 py-2"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Logger inn...
              </>
            ) : (
              'Logg inn'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
```