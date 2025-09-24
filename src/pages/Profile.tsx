import { useState, useCallback, useEffect } from 'react';
import { User, Mail, Hash, Calendar, Camera, Pencil, X, Check, Loader2, ExternalLink, FileText, Download, Upload, Shield } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase, uploadProfileImage, uploadStartkortPDF, uploadDiplomaPDF, setUserContext } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { DatePicker } from '../components/ui/date-picker';
import { useToast } from '../hooks/use-toast';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
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

  // Load profile data from database with RLS support
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.email) {
        console.log('🔍 Profile Debug - No user email available');
        return;
      }
      
      console.log('🔍 Profile Debug - User email:', user.email);
      
      try {
        setIsLoading(true);
        
        // Ensure user context is set for RLS
        await setUserContext(user.email);
        console.log('🔍 User context set for RLS');
        
        // Load profile data from organization_members table using email (matches RLS policy)
        const { data: memberData, error } = await supabase
          .from('organization_members')
          .select('*')
          .eq('email', user.email)
          .maybeSingle(); // Use maybeSingle to avoid errors when no data found

        console.log('🔍 Profile Debug - Member query result:', { memberData, error });

        if (error) {
          console.error('❌ Database error loading member profile:', error);
          toast({
            title: "Database Error",
            description: `Could not load profile data: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        if (!memberData) {
          console.warn('⚠️ No member data found for user email:', user.email);
          toast({
            title: "Profile Not Found",
            description: "Your profile could not be found. Please contact your administrator.",
            variant: "destructive",
          });
          return;
        }

        // Use data from organization_members table and store member ID for updates
        setUserId(memberData.id);
        
        const newProfileData: ProfileData = {
          name: memberData.full_name || '',
          email: memberData.email || '',
          memberNumber: memberData.member_number || '',
          joinDate: memberData.created_at ? new Date(memberData.created_at).toLocaleDateString('nb-NO') : '',
          avatarUrl: memberData.avatar_url || undefined,
          startkortUrl: memberData.startkort_url || undefined,
          startkortFileName: memberData.startkort_file_name || undefined,
          diplomaUrl: memberData.diploma_url || undefined,
          diplomaFileName: memberData.diploma_file_name || undefined,
        };
        
        setProfileData(newProfileData);
        setEditData(newProfileData);
        setProfileRole(memberData.role as 'super_user' | 'member' | 'admin' | 'range_officer' || 'member');
        
        // Load other files from organization_members
        if (memberData.other_files && Array.isArray(memberData.other_files)) {
          setOtherFiles(memberData.other_files as { url: string; name: string; }[]);
        } else {
          setOtherFiles([]);
        }

        console.log('✅ Profile data loaded successfully from organization_members');
        
      } catch (error) {
        console.error('❌ Unexpected error in loadProfileData:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading your profile.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!user?.email) {
      console.error('❌ No user email available for avatar upload');
      return;
    }

    console.log('🔍 Avatar Upload Debug - Starting upload:', {
      userEmail: user.email,
      userId,
      fileCount: acceptedFiles.length
    });

    try {
      setIsLoading(true);
      const file = acceptedFiles[0];
      const imageUrl = await uploadProfileImage(file, userId || 'fallback');
      
      console.log('🔍 Avatar Upload Debug - Image uploaded:', imageUrl);
      
      // Update profile with new avatar URL in organization_members table using email
      const { error } = await supabase
        .from('organization_members')
        .update({ avatar_url: imageUrl })
        .eq('email', user.email);

      console.log('🔍 Avatar Upload Debug - Database update result:', { error });

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({ ...prev, avatarUrl: imageUrl }));
      setEditData(prev => ({ ...prev, avatarUrl: imageUrl }));

      console.log('✅ Avatar uploaded successfully');
      
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste opp profilbilde. Prøv igjen.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, userId, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleSave = async () => {
    if (!user?.email) {
      console.error('❌ No user email available for save');
      return;
    }
    
    console.log('🔍 Profile Save Debug - Starting save with:', {
      userEmail: user.email,
      editData,
      userId
    });
    
    try {
      setIsLoading(true);
      
      // Update profile in organization_members table using email (matches RLS policy)
      const { error } = await supabase
        .from('organization_members')
        .update({
          full_name: editData.name,
          email: editData.email,
          member_number: editData.memberNumber,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);

      console.log('🔍 Profile Save Debug - Update result:', { error });

      if (error) {
        throw error;
      }

      // Update local state
      setProfileData(editData);
      setIsEditing(false);
      
      // Show success message
      toast({
        title: "Profil oppdatert",
        description: "Profilendringene dine har blitt lagret.",
      });

      console.log('✅ Profile saved successfully');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre profilendringene. Prøv igjen.",
        variant: "destructive",
      });
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
      
      const publicUrl = await uploadStartkortPDF(file, userId || 'fallback');
      
      // Update profile with new startkort URL in organization_members table using email
      const { error } = await supabase
        .from('organization_members')
        .update({ startkort_url: publicUrl, startkort_file_name: fileName })
        .eq('email', user!.email);

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
      
      const publicUrl = await uploadDiplomaPDF(file, userId || 'fallback');

      // Update profile with new diploma URL in organization_members table using email  
      const { error } = await supabase
        .from('organization_members')
        .update({ diploma_url: publicUrl, diploma_file_name: fileName })
        .eq('email', user!.email);

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
        const filePath = `other_files/${userId}/${uniqueFileName}`;
        
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

      // Update the user's profile with the new list of other files (as JSONB) in organization_members table using email
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ other_files: updatedFiles })
        .eq('email', user.email);

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

        // Update the user's profile in organization_members table with the modified list using email
        const { error } = await supabase
          .from('organization_members')
          .update({ other_files: updatedFiles })
          .eq('email', user?.email || '');

        if (error) {
          throw new Error(`Kunne ikke slette filen fra profilen: ${error.message}`);
        }

        // Optionally, delete the file from storage as well
        if (fileToDelete.url.includes('supabase')) {
          const filePath = fileToDelete.url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('documents')
              .remove([`other_files/${userId}/${fileToDelete.name}`]);
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
            <div className="flex-grow">
              <p className="text-sm text-gray-400">{t('profile.member_since')}</p>
              {isEditing ? (
                <DatePicker
                  value={editData.joinDate}
                  onChange={(date) => setEditData(prev => ({ ...prev, joinDate: date }))}
                  placeholder="Velg medlemsdato"
                  className="w-full"
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