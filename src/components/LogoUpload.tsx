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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Logo drop initiated:', { acceptedFiles: acceptedFiles.length, organization: organization?.id });
    
    if (acceptedFiles.length === 0) {
      setError('Ingen filer valgt');
      return;
    }
    
    if (!organization) {
      setError('Ingen organisasjon valgt');
      return;
    }

    const file = acceptedFiles[0];
    console.log('Processing file:', { name: file.name, size: file.size, type: file.type });
    
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateOrganizationLogo(organization.id, file);
      
      if (result.error) {
        console.error('Upload result error:', result.error);
        throw new Error(result.error);
      }

      console.log('Upload successful:', result.data);
      setSuccess(true);
      if (onLogoUpdated && result.data) {
        onLogoUpdated(result.data);
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error('Error uploading logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke laste opp logo';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [organization, onLogoUpdated]);

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
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Laster opp...</span>
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
          <p className="text-sm">Logo oppdatert! Siden vil oppdateres automatisk.</p>
        </div>
      )}
    </div>
  );
}