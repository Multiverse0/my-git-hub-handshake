import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { updateOrganizationLogo } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LogoUploadProps {
  onLogoUpdated?: (logoUrl: string) => void;
}

export function LogoUpload({ onLogoUpdated }: LogoUploadProps) {
  const { user, organization, branding } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Logo drop initiated:', { 
      acceptedFiles: acceptedFiles.length, 
      organization: organization?.id,
      user: user?.email,
      userType: user?.user_type,
      memberRole: user?.member_profile?.role
    });
    
    // Reset states
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    
    // Validate inputs
    if (acceptedFiles.length === 0) {
      setError('Ingen filer valgt');
      return;
    }
    
    if (!user) {
      setError('Du må være innlogget for å laste opp logo');
      return;
    }
    
    if (!organization) {
      setError('Ingen organisasjon valgt. Vennligst velg en organisasjon først.');
      return;
    }

    // Check permissions before upload
    const isAdmin = user.member_profile?.role === 'admin';
    const isSuperUser = user.user_type === 'super_user';
    
    if (!isAdmin && !isSuperUser) {
      setError('Kun administratorer og super-brukere kan laste opp organisasjonslogo');
      return;
    }

    const file = acceptedFiles[0];
    console.log('Processing file:', { 
      name: file.name, 
      size: file.size, 
      type: file.type,
      sizeInMB: (file.size / 1024 / 1024).toFixed(2)
    });

    // Client-side validation
    if (file.size > 2 * 1024 * 1024) {
      setError(`Filen er for stor (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimal størrelse er 2MB.`);
      return;
    }

    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Ugyldig filtype: ${file.type}. Kun SVG, PNG og JPG er tillatt.`);
      return;
    }
    
    setUploading(true);
    setUploadProgress(10);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await updateOrganizationLogo(organization.id, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.error) {
        console.error('Upload result error:', result.error);
        throw new Error(result.error);
      }

      console.log('Upload successful:', result.data);
      setSuccess(true);
      
      if (onLogoUpdated && result.data) {
        onLogoUpdated(result.data);
      }

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
        setUploadProgress(0);
      }, 5000);

    } catch (error) {
      console.error('Error uploading logo:', error);
      
      // Enhanced error messaging
      let errorMessage = 'Kunne ikke laste opp logo';
      
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Du har ikke tilgang til å laste opp logo for denne organisasjonen';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Nettverksfeil. Sjekk internettforbindelsen og prøv igjen.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Opplastingen tok for lang tid. Prøv igjen med en mindre fil.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }, [organization, onLogoUpdated, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/svg+xml': ['.svg'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 2 * 1024 * 1024, // 2MB
    multiple: false,
    disabled: uploading || !organization || (user?.user_type !== 'super_user' && user?.member_profile?.role !== 'admin')
  });

  // Show for super users and organization admins
  if (!user || !organization || (user.user_type !== 'super_user' && user.member_profile?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Organisasjonslogo</h3>
        <div className="text-sm text-gray-400">
          Super-brukere og administratorer
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-500'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {branding.logo_url ? (
            <div className="flex flex-col items-center space-y-2">
              <img 
                src={branding.logo_url} 
                alt="Current logo" 
                className="h-16 max-w-[200px] object-contain"
              />
              <p className="text-sm text-gray-400">Nåværende logo</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
          )}

          {uploading ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div className="text-sm text-gray-400">
                Laster opp logo... {uploadProgress}%
              </div>
              <div className="w-full max-w-xs bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? 'Slipp filen her...' : 'Last opp ny logo'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Dra og slipp eller klikk for å velge fil
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Støttede formater:</strong> SVG, PNG, JPG</p>
            <p><strong>Maksimal størrelse:</strong> 2MB</p>
            <p><strong>Anbefalt størrelse:</strong> 200x80 piksler (eller tilsvarende forhold)</p>
            <p><strong>Tips:</strong> SVG gir best kvalitet på alle skjermstørrelser</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Logo oppdatert!</p>
            <p className="text-xs text-green-300">Siden vil oppdateres automatisk om noen sekunder.</p>
          </div>
        </div>
      )}
      
      {!uploading && !success && !error && user && organization && (
        <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
          <strong>Tips:</strong> Bruk SVG-format for best kvalitet på alle skjermstørrelser. 
          Anbefalt størrelse: 200x80px eller tilsvarende forhold.
        </div>
      )}
    </div>
  );
}