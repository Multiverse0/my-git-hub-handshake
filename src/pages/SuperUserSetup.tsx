import React, { useState } from 'react';
import { Shield, Mail, Lock, User, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createFirstSuperUser } from '../lib/supabase';

interface SuperUserSetupProps {
  onSetupComplete: () => void;
}

export function SuperUserSetup({ onSetupComplete }: SuperUserSetupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !fullName) {
      setError('Vennligst fyll ut alle felt');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passordene stemmer ikke overens');
      return;
    }

    if (password.length < 8) {
      setError('Passordet må være minst 8 tegn langt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await createFirstSuperUser(email, password, fullName);
      
      if (result.error) {
        setError(result.error);
        return;
      }

      // Setup complete
      onSetupComplete();
    } catch (error) {
      setError('Det oppstod en feil ved opprettelse av super-bruker');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-gray-900" />
          </div>
          <h1 className="text-2xl font-bold text-yellow-500">
            Første gangs oppsett
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Opprett den første super-administratoren for systemet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fullt navn
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                placeholder="Skriv inn fullt navn"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              E-post
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2 text-white"
                placeholder="admin@example.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2 text-white"
                placeholder="Minst 8 tegn"
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Bekreft passord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-12 py-2 text-white"
                placeholder="Gjenta passordet"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Oppretter super-bruker...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Opprett super-bruker
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-blue-200 text-sm">
            <strong>Viktig:</strong> Dette oppsettet kan kun kjøres én gang. 
            Etter at den første super-brukeren er opprettet, vil denne siden ikke være tilgjengelig.
          </p>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/landing.html" 
            target="_blank"
            className="text-yellow-400 hover:text-yellow-300 text-sm underline"
          >
            📄 Se AKTIVLOGG.no landingsside
          </a>
        </div>
      </div>
    </div>
  );
}