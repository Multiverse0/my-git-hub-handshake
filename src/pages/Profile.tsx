import { useState, useCallback, useEffect } from 'react';
import { User, Mail, Hash, Calendar, Camera, Pencil, X, Check, Loader2, ExternalLink, FileText, Download, Upload, Shield } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase, uploadProfileImage, uploadStartkortPDF, uploadDiplomaPDF } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileData {
  name: string;
  email: string;
  memberNumber: string;
  joinDate: string;
  avatarUrl?: string;
  startkortUrl?: string;
  startkortFileName?: string;
  diplomaUrl?: string; // This is for member card
  diplomaFileName?: string;
  otherFilesUrl?: string;
  otherFilesFileName?: string;
}

export function Profile() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploadingStartkort, setUploadingStartkort] = useState(false);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [uploadingOtherFiles, setUploadingOtherFiles] = useState(false);
  const [profileRole, setProfileRole] = useState<'member' | 'admin' | 'range_officer' | 'super_user' | undefined>(undefined);
  const [otherFiles, setOtherFiles] = useState<Array<{url: string, name: string}>>([]);
  const [startkortError, setStartkortError] = useState<string | null>(null);
  const [diplomaError, setDiplomaError] = useState<string | null>(null);
  const [otherFilesError, setOtherFilesError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    memberNumber: '',
    joinDate: '',
    avatarUrl: undefined,
    startkortUrl: undefined,
    startkortFileName: undefined,
    diplomaUrl: undefined, // This is for member card
    diplomaFileName: undefined
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Load profile data from auth context
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;
      
      try {
        // Load profile from Supabase profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
          // Fallback to auth context data
          if (profile) {
            const fallbackData: ProfileData = {
              name: profile.full_name || '',
              email: profile.email || user.email || '',
              memberNumber: (profile as any)?.member_number || '',
              joinDate: profile.created_at ? new Date(profile.created_at).toLocaleDateString('nb-NO') : '',
              avatarUrl: (profile as any)?.avatar_url,
              startkortUrl: (profile as any)?.startkort_url,
              startkortFileName: (profile as any)?.startkort_file_name,
              diplomaUrl: (profile as any)?.diploma_url,
              diplomaFileName: (profile as any)?.diploma_file_name,
            };
            setProfileData(fallbackData);
            setEditData(fallbackData);
            setProfileRole((profile as any)?.role || 'admin');
          }
          return;
        }

        // Use data from profiles table
        const newProfileData: ProfileData = {
          name: profileData.full_name || '',
          email: profileData.email || '',
          memberNumber: profileData.member_number || '',
          joinDate: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('nb-NO') : '',
          avatarUrl: profileData.avatar_url || undefined,
          startkortUrl: profileData.startkort_url || undefined,
          startkortFileName: profileData.startkort_file_name || undefined,
          diplomaUrl: profileData.diploma_url || undefined,
          diplomaFileName: profileData.diploma_file_name || undefined,
        };
        
        setProfileData(newProfileData);
        setEditData(newProfileData);
        setProfileRole(profileData.role as 'super_user' | 'member' | 'admin' | 'range_officer' || 'member');
        
        // Load other files from profiles table
        if (profileData.other_files && Array.isArray(profileData.other_files)) {
          setOtherFiles(profileData.other_files as { url: string; name: string; }[]);
        } else {
          setOtherFiles([]);
        }
        
      } catch (error) {
        console.error('Error in loadProfileData:', error);
      }
    };

    loadProfileData();
  }, [user, profile]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!userId) return;

    try {
      setIsLoading(true);
      const file = acceptedFiles[0];
      const imageUrl = await uploadProfileImage(file, userId);
      
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: imageUrl })
        .eq('id', userId);

      if (error) throw error;

      setProfileData(prev => ({ ...prev, avatarUrl: imageUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.name,
          email: editData.email,
          member_number: editData.memberNumber,
          // join_date is created_at, not directly editable
          // role is not directly editable by user
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // If email changed, update auth email as well
      if (user.email !== editData.email) {
        await supabase.auth.updateUser({ email: editData.email });
      }

      // Update local state
      setProfileData(editData);
      setIsEditing(false);
      
      // Update auth context without full page refresh
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartkortUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingStartkort(true);
      setStartkortError(null);
      
      // Validate file type
      const fileType = file.type;
      const fileName = file.name;
      
      if (!fileType.includes('pdf') && !fileType.includes('image')) {
        throw new Error('Kun PDF og bildefiler (JPG, PNG) er tillatt.');
      }
      
      const publicUrl = await uploadStartkortPDF(file, user!.id);
      
      // Update profile with new startkort URL
      const { error } = await supabase
        .from('profiles')
        .update({ startkort_url: publicUrl, startkort_file_name: fileName })
        .eq('id', user!.id);

      if (error) throw error;

      setProfileData(prev => ({
        ...prev,
        startkortUrl: publicUrl,
        startkortFileName: fileName
      }));
    } catch (error) {
      console.error('Error uploading Startkort:', error);
      setStartkortError(error instanceof Error ? error.message : 'Det oppstod en feil ved opplasting av Startkort.');
    } finally {
      setUploadingStartkort(false);
    }
  };

  const handleDiplomaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDiploma(true);
      setDiplomaError(null);
      
      // Validate file type
      const fileType = file.type;
      const fileName = file.name;
      
      if (!fileType.includes('pdf') && !fileType.includes('image')) {
        throw new Error('Kun PDF og bildefiler (JPG, PNG) er tillatt.');
      }
      
      const publicUrl = await uploadDiplomaPDF(file, user!.id);

      // Update profile with new diploma URL
      const { error } = await supabase
        .from('profiles')
        .update({ diploma_url: publicUrl, diploma_file_name: fileName })
        .eq('id', user!.id);

      if (error) throw error;

      setProfileData(prev => ({
        ...prev,
        diplomaUrl: publicUrl,
        diplomaFileName: fileName
      }));
    } catch (error) {
      console.error('Error uploading Diploma:', error);
      setDiplomaError(error instanceof Error ? error.message : 'Det oppstod en feil ved opplasting av diplomet.');
    } finally {
      setUploadingDiploma(false);
    }
  };

  const handleOtherFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    if (!user?.id) {
      setOtherFilesError('Bruker ikke funnet');
      return;
    }

    try {
      setUploadingOtherFiles(true);
      setOtherFilesError(null);
      
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        const fileType = file.type;
        const fileName = file.name;
        
        if (!fileType.includes('pdf') && !fileType.includes('image')) {
          throw new Error(`${fileName}: Kun PDF og bildefiler (JPG, PNG) er tillatt.`);
        }
        
        // Validate file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`${fileName}: Filen er for stor. Maksimal størrelse er 2MB.`);
        }
        
        // Upload to Supabase Storage
        const fileExt = fileName.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `other_files/${user.id}/${uniqueFileName}`;
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            upsert: false
          });

        if (error) {
          throw new Error(`Kunne ikke laste opp filen ${fileName}: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(data.path);

        return { url: publicUrl, name: fileName };
      });
      
      // Wait for all files to be processed
      const uploadedFiles = await Promise.all(uploadPromises);
      
      // Add to existing files
      const updatedFiles = [...otherFiles, ...uploadedFiles];
      setOtherFiles(updatedFiles);

      // Update the user's profile with the new list of other files (as JSONB)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ other_files: updatedFiles })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Kunne ikke oppdatere profilen med filinformasjon: ${updateError.message}`);
      }
      
      console.log(`✅ ${uploadedFiles.length} fil(er) lastet opp`);
      
    } catch (error) {
      console.error('Error uploading other files:', error);
      setOtherFilesError(error instanceof Error ? error.message : 'Det oppstod en feil ved opplasting av filene.');
      
      // Reset file input on error
      event.target.value = '';
    } finally {
      setUploadingOtherFiles(false);
    }
  };

  const handleDeleteOtherFile = (fileIndex: number) => {
    if (!window.confirm('Er du sikker på at du vil slette denne filen?')) {
      return;
    }

    const deleteFile = async () => {
      try {
        const fileToDelete = otherFiles[fileIndex];
        
        // Remove from local state first
        const updatedFiles = otherFiles.filter((_, index) => index !== fileIndex);
        setOtherFiles(updatedFiles);

        // Update the user's profile in Supabase with the modified list
        const { error } = await supabase
          .from('profiles')
          .update({ other_files: updatedFiles })
          .eq('id', user?.id || '');

        if (error) {
          throw new Error(`Kunne ikke slette filen fra profilen: ${error.message}`);
        }

        // Optionally, delete the file from storage as well
        if (fileToDelete.url.includes('supabase')) {
          const filePath = fileToDelete.url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('documents')
              .remove([`other_files/${user?.id}/${fileToDelete.name}`]);
          }
        }
        
        console.log('✅ File deleted successfully');
        
      } catch (error) {
        console.error('Error deleting file:', error);
        setOtherFilesError('Kunne ikke slette filen');
        
        // Revert local state on error
        const revertedFiles = [...otherFiles];
        setOtherFiles(revertedFiles);
      }
    };

    deleteFile();
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-svpk-yellow mb-4">
          {t('profile.title')}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {t('profile.description')}
        </p>
      </header>

      <div className="card max-w-2xl mx-auto">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div 
              {...getRootProps()}
              className={`relative w-24 h-24 rounded-full overflow-hidden cursor-pointer
                ${isDragActive ? 'ring-2 ring-svpk-yellow' : ''}
                ${isLoading ? 'opacity-50' : ''}`}
            >
              <input {...getInputProps()} />
              {profileData.avatarUrl ? (
                <img 
                  src={profileData.avatarUrl} 
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="bg-gray-700 w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-svpk-yellow" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-svpk-yellow animate-spin" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 text-white px-3 py-1 rounded-md"
                />
              ) : (
                profileData.name || 'Ikke angitt'
              )}
            </h2>
            <p className="text-gray-400">{t('profile.member')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
            <Shield className="w-6 h-6 text-svpk-yellow" />
            <div className="flex-grow">
              <p className="text-sm text-gray-400">Rolle</p>
              <p className="font-medium">
                {profileRole === 'super_user' ? 'Super Administrator' :
                 profileRole === 'admin' ? 'Administrator' :
                 profileRole === 'range_officer' ? 'Standplassleder' :
                 'Medlem'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
            <Mail className="w-6 h-6 text-svpk-yellow" />
            <div className="flex-grow">
              <p className="text-sm text-gray-400">{t('profile.email')}</p>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={e => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-600 text-white px-2 py-1 rounded w-full"
                />
              ) : (
                <p className="font-medium">{profileData.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
            <Hash className="w-6 h-6 text-svpk-yellow" />
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">{t('profile.member_id')}</p>
                <a
                  href="https://app.skyting.no/user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-svpk-yellow hover:text-yellow-400 flex items-center gap-1"
                >
                  <span>{t('profile.find_id')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.memberNumber}
                  onChange={e => setEditData(prev => ({ ...prev, memberNumber: e.target.value }))}
                  className="bg-gray-600 text-white px-2 py-1 rounded w-full"
                />
              ) : (
                <p className="font-medium">{profileData.memberNumber}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
            <Calendar className="w-6 h-6 text-svpk-yellow" />
            <div>
              <p className="text-sm text-gray-400">{t('profile.member_since')}</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editData.joinDate ? (
                    editData.joinDate.includes('-') 
                      ? editData.joinDate 
                      : editData.joinDate.split('.').reverse().join('-')
                  ) : ''}
                  onChange={e => {
                    const date = new Date(e.target.value);
                    const formattedDate = date.toLocaleDateString('nb-NO');
                    setEditData(prev => ({ ...prev, joinDate: formattedDate }));
                  }}
                  className="bg-gray-600 text-white px-2 py-1 rounded w-full"
                />
              ) : (
                <p className="font-medium">{profileData.joinDate || t('profile.not_specified')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 flex gap-4">
          {isEditing ? (
            <>
              <button 
                className="btn-primary flex-1 relative z-[1000]"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('profile.save')}
                  </>
                )}
              </button>
              <button 
                className="btn-secondary relative z-[1000]"
                onClick={() => {
                  setIsEditing(false);
                  setEditData(profileData);
                }}
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
                {t('profile.cancel')}
              </button>
            </>
          ) : (
            <button 
              className="btn-secondary flex-1"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="w-5 h-5" />
              {t('profile.edit_profile')}
            </button>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('profile.startkort_membercard')}</h3>
            <div className="text-sm text-gray-400">{t('profile.optional')}</div>
          </div>
          
          <div className="space-y-6">
            {/* Startkort Section */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-600 p-2 rounded">
                    <FileText className="w-6 h-6 text-svpk-yellow" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{t('profile.upload_startkort')}</h4>
                      <a
                        href="https://app.skyting.no/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-svpk-yellow hover:text-yellow-400 flex items-center gap-1"
                      >
                        <span>{t('profile.find_startkort')}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-400">PDF, JPG eller PNG-fil, maks 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {profileData.startkortUrl && profileData.startkortFileName ? (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-400">Fil lastet opp:</p>
                            <p className="text-sm text-gray-300">{profileData.startkortFileName}</p>
                          </div>
                          <a
                            href={profileData.startkortUrl}
                            download={profileData.startkortFileName}
                            className="btn-secondary"
                          >
                            <Download className="w-4 h-4" />
                            <span>Last ned fil</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Ingen fil lastet opp</div>
                  )}
                  
                  <label className="btn-secondary cursor-pointer ml-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleStartkortUpload}
                      className="hidden"
                    />
                    {uploadingStartkort ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Laster opp...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{profileData.startkortUrl ? 'Bytt fil' : 'Last opp fil'}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {startkortError && (
                <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                  {startkortError}
                </div>
              )}
            </div>

            {/* Medlemskort Section */}
            <div className="bg-gray-700 rounded-lg p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-600 p-2 rounded">
                    <FileText className="w-6 h-6 text-svpk-yellow" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">Last opp ditt Medlemskort</h4>
                      <a
                        href="https://www.minidrett.no/profil/medlemskap"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-svpk-yellow hover:text-yellow-400 flex items-center gap-1"
                      >
                        <span>Her finner du medlemskortet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-sm text-gray-400">PDF, JPG eller PNG-fil, maks 5MB</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {profileData.diplomaUrl && profileData.diplomaFileName ? (
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-400">Fil lastet opp:</p>
                            <p className="text-sm text-gray-300">{profileData.diplomaFileName}</p>
                          </div>
                          <a
                            href={profileData.diplomaUrl}
                            download={profileData.diplomaFileName}
                            className="btn-secondary"
                          >
                            <Download className="w-4 h-4" />
                            <span>Last ned fil</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Ingen fil lastet opp</div>
                  )}
                  
                  <label className="btn-secondary cursor-pointer ml-4">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleDiplomaUpload}
                      className="hidden"
                    />
                    {uploadingDiploma ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Laster opp...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{profileData.diplomaUrl ? 'Bytt fil' : 'Last opp fil'}</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {diplomaError && (
                <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                  {diplomaError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">Personlige innstillinger</h3>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h4 className="font-medium mb-2">Tema-preferanse</h4>
                <ThemeToggle />
                <p className="text-xs text-gray-400 mt-2">
                  Dette endrer kun temaet for deg. Andre brukere beholder sine egne innstillinger.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Andre filer (Våpenkort, våpenskap, etc)</h3>
            <div className="text-sm text-gray-400">Valgfritt</div>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-gray-600 p-2 rounded">
                  <FileText className="w-6 h-6 text-svpk-yellow" />
                </div>
                <div>
                  <h4 className="font-medium">Last opp våpenkort og andre relevante filer</h4>
                  <p className="text-sm text-gray-400">PDF, JPG eller PNG-filer, maks 2MB per fil</p>
                </div>
              </div>

              {otherFiles.length > 0 ? (
                <div className="space-y-3">
                  {otherFiles.map((file, index) => (
                    <div key={index} className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-400">Fil {index + 1}:</p>
                          <p className="text-sm text-gray-300">{file.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url}
                            download={file.name}
                            className="btn-secondary"
                          >
                            <Download className="w-4 h-4" />
                            <span>Last ned</span>
                          </a>
                          <button
                            onClick={() => handleDeleteOtherFile(index)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Ingen filer lastet opp</div>
              )}
              
              <label className="btn-secondary cursor-pointer w-full mt-4">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleOtherFilesUpload}
                  className="hidden"
                />
                {uploadingOtherFiles ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('profile.upload_files')}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{t('profile.upload_files')}</span>
                  </>
                )}
              </label>
            </div>

            {otherFilesError && (
              <div className="mt-3 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                {otherFilesError}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}