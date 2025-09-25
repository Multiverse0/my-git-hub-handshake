import { useState, useCallback, useEffect } from 'react';
import { User, Mail, Hash, Calendar, Camera, Pencil, X, Check, Loader2, ExternalLink, FileText, Download, Upload, Shield } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase, uploadProfileImage, uploadStartkortPDF, uploadDiplomaPDF } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../hooks/use-toast';
import { DatePicker } from '../components/ui/date-picker';

interface ProfileData {
  name: string;
  email: string;
  memberNumber: string;
  joinDate: string;
  birthDate: string;
  avatarUrl?: string;
  startkortUrl?: string;
  startkortFileName?: string;
  diplomaUrl?: string; // This is for member card
  diplomaFileName?: string;
  otherFilesUrl?: string;
  otherFilesFileName?: string;
  organizationName?: string;
  organizationLogo?: string;
  role?: string;
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
    birthDate: '',
    avatarUrl: undefined,
    startkortUrl: undefined,
    startkortFileName: undefined,
    diplomaUrl: undefined, // This is for member card
    diplomaFileName: undefined
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Load profile data using auth-based RLS with improved error handling
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) {
        console.log('🔍 Profile Debug - No user ID available');
        setIsLoading(false);
        return;
      }
      
      console.log('🔍 Profile Debug - Loading profile for user ID:', user.id);
      
      try {
        setIsLoading(true);
        
        // First check if user has auth session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('❌ No valid auth session:', sessionError);
          toast({
            title: "Authentication Error",
            description: "Please log out and log back in to access your profile.",
            variant: "destructive",
          });
          return;
        }
        
        // Load profile data with organization information
        let { data: memberData, error } = await supabase
          .from('organization_members')
          .select(`
            *,
            organizations (
              name,
              logo_url,
              primary_color,
              secondary_color
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('🔍 Profile Debug - Member query result:', { memberData, error, userAuthId: user.id });

        if (error) {
          console.error('❌ Database error loading member profile:', error);
          toast({
            title: "Database Error",
            description: `Could not load profile data: ${error.message}. Please contact support if this persists.`,
            variant: "destructive",
          });
          return;
        }

        if (!memberData) {
          console.warn('⚠️ No organization member record found for user ID:', user.id);
          
          // Try fallback lookup by email and attempt to repair the data
          if (user.email) {
            console.log('🔧 Attempting to repair member linkage using case-insensitive matching:', user.email);
            
            // Use the new database function for case-insensitive email matching
            const { data: repairResult, error: repairError } = await supabase
              .rpc('link_member_to_auth_user', { member_email: user.email });

            if (!repairError && repairResult) {
              console.log('✅ Successfully repaired profile link using case-insensitive matching');
              
              // Retry loading the profile after repair
              const { data: repairedMemberData, error: repairedError } = await supabase
                .from('organization_members')
                .select(`
                  *,
                  organizations (
                    name,
                    logo_url,
                    primary_color,
                    secondary_color
                  )
                `)
                .eq('user_id', user.id)
                .eq('approved', true)
                .eq('active', true)
                .maybeSingle();

              if (repairedMemberData && !repairedError) {
                console.log('✅ Profile successfully loaded after repair');
                memberData = repairedMemberData; // Use the repaired data
              }
            }
          }

          // If we still don't have memberData after repair attempts
          if (!memberData) {
            console.log('❌ Could not find or repair member profile');
            toast({
              title: "Profile Setup Required",
              description: "Your account exists but you need to join an organization or wait for admin approval. Please contact your administrator.",
              variant: "destructive",
            });
            return;
          }
        }

        // Validate that this organization_members record properly links to auth
        if (!memberData.user_id) {
          console.error('❌ Organization member record found but user_id is null:', memberData);
          toast({
            title: "Data Integrity Error",
            description: "Your profile has a data issue. Please contact your administrator to fix your account linking.",
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
          birthDate: memberData.birth_date ? new Date(memberData.birth_date).toLocaleDateString('nb-NO') : '',
          avatarUrl: memberData.avatar_url || undefined,
          startkortUrl: memberData.startkort_url || undefined,
          startkortFileName: memberData.startkort_file_name || undefined,
          diplomaUrl: memberData.diploma_url || undefined,
          diplomaFileName: memberData.diploma_file_name || undefined,
          organizationName: memberData.organizations?.name || 'Unknown Organization',
          organizationLogo: memberData.organizations?.logo_url || undefined,
          role: memberData.role || 'member',
        };
        
        setProfileData(newProfileData);
        setEditData(newProfileData);
        setProfileRole(memberData.role as 'super_user' | 'member' | 'admin' | 'range_officer' || 'member');
        
        // Load other files from organization_members with validation
        if (memberData.other_files && Array.isArray(memberData.other_files)) {
          setOtherFiles(memberData.other_files as { url: string; name: string; }[]);
        } else {
          setOtherFiles([]);
        }

        console.log('✅ Profile data loaded successfully:', {
          memberName: memberData.full_name,
          memberEmail: memberData.email,
          organization: memberData.organizations?.name,
          hasBirthDate: !!memberData.birth_date
        });
        
      } catch (error) {
        console.error('❌ Unexpected error in loadProfileData:', error);
        
        // Provide more specific error messages based on error type
        let errorMessage = "An unexpected error occurred while loading your profile.";
        
        if (error instanceof Error) {
          if (error.message.includes('JWT')) {
            errorMessage = "Your session has expired. Please log out and log back in.";
          } else if (error.message.includes('permission')) {
            errorMessage = "You don't have permission to access this profile. Please contact your administrator.";
          } else if (error.message.includes('network')) {
            errorMessage = "Network error. Please check your connection and try again.";
          }
        }
        
        toast({
          title: "Error Loading Profile",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, toast]);

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
      
      // Update profile with new avatar URL using user_id
      const { error } = await supabase
        .from('organization_members')
        .update({ avatar_url: imageUrl })
        .eq('user_id', user.id);

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
    if (!user?.id) {
      console.error('❌ No user ID available for save');
      toast({
        title: "Feil",
        description: "Ingen bruker-ID tilgjengelig. Prøv å logge ut og inn igjen.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('🔍 Profile Save Debug - Starting save for user:', user.id);
    
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!editData.name?.trim()) {
        throw new Error('Navn er påkrevd');
      }
      
      if (!editData.email?.trim()) {
        throw new Error('E-post er påkrevd');
      }
      
      // Parse and validate birth date from Norwegian format to ISO date
      let birthDateISO = null;
      if (editData.birthDate?.trim()) {
        try {
          // Handle different date formats
          let day, month, year;
          
          if (editData.birthDate.includes('.')) {
            // Norwegian format: DD.MM.YYYY
            [day, month, year] = editData.birthDate.split('.');
          } else if (editData.birthDate.includes('/')) {
            // Alternative format: DD/MM/YYYY
            [day, month, year] = editData.birthDate.split('/');
          } else if (editData.birthDate.includes('-')) {
            // ISO format: YYYY-MM-DD (convert back)
            const parts = editData.birthDate.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
              year = parts[0];
              month = parts[1];
              day = parts[2];
            }
          }
          
          if (day && month && year) {
            // Validate date components
            const dayNum = parseInt(day, 10);
            const monthNum = parseInt(month, 10);
            const yearNum = parseInt(year, 10);
            
            if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
              throw new Error('Ugyldig fødselsdato');
            }
            
            birthDateISO = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            
            // Validate the ISO date can be parsed
            const testDate = new Date(birthDateISO);
            if (isNaN(testDate.getTime())) {
              throw new Error('Ugyldig fødselsdato format');
            }
          }
        } catch (dateError) {
          console.warn('Could not parse birth date:', editData.birthDate, dateError);
          throw new Error('Ugyldig fødselsdato. Bruk format DD.MM.YYYY');
        }
      }

      // Update profile using user_id with validation
      const updateData = {
        full_name: editData.name.trim(),
        email: editData.email.trim(),
        member_number: editData.memberNumber?.trim() || null,
        birth_date: birthDateISO,
        updated_at: new Date().toISOString()
      };

      console.log('🔍 Profile Save Debug - Update data:', updateData);

      const { data, error, count } = await supabase
        .from('organization_members')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      console.log('🔍 Profile Save Debug - Update result:', { data, error, count, updatedRows: data?.length });

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No profile was updated. Please ensure your profile exists and try again.');
      }

      // Update local state with the saved data
      const updatedProfile = { ...editData };
      if (birthDateISO) {
        // Convert back to Norwegian format for display
        const birthDate = new Date(birthDateISO);
        updatedProfile.birthDate = birthDate.toLocaleDateString('nb-NO');
      }
      
      setProfileData(updatedProfile);
      setIsEditing(false);
      
      // Show success message
      toast({
        title: "Profil oppdatert",
        description: "Profilendringene dine har blitt lagret.",
      });

      console.log('✅ Profile saved successfully for user:', user.id);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke lagre profilendringene. Prøv igjen.';
      
      toast({
        title: "Feil ved lagring",
        description: errorMessage,
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
      
      // Update profile with new startkort URL using user_id
      const { error } = await supabase
        .from('organization_members')
        .update({ startkort_url: publicUrl, startkort_file_name: fileName })
        .eq('user_id', user!.id);

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

      // Update profile with new diploma URL using user_id
      const { error } = await supabase
        .from('organization_members')
        .update({ diploma_url: publicUrl, diploma_file_name: fileName })
        .eq('user_id', user!.id);

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

      // Update the user's profile with the new list of other files using user_id
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ other_files: updatedFiles })
        .eq('user_id', user.id);

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

        // Update the user's profile with the modified list using user_id
        const { error } = await supabase
          .from('organization_members')
          .update({ other_files: updatedFiles })
          .eq('user_id', user?.id || '');

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
        {/* Organization Header */}
        {profileData.organizationName && (
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
            {profileData.organizationLogo && (
              <img 
                src={profileData.organizationLogo} 
                alt={profileData.organizationName}
                className="w-12 h-12 object-contain"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-300">{profileData.organizationName}</h3>
              <p className="text-sm text-gray-500">Medlemsprofil</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 mb-8">
          <div className="relative group">
            <div 
              {...getRootProps()}
              className={`relative w-24 h-24 rounded-full overflow-hidden cursor-pointer
                ${isDragActive ? 'ring-2 ring-primary' : ''}
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
                <div className="bg-muted w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-bold">
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-muted border border-border rounded px-3 py-1"
                  />
                ) : (
                  profileData.name || 'Ikke angitt'
                )}
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 p-1 rounded-full hover:bg-muted transition-colors"
                  disabled={isLoading}
                >
                  <Pencil className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="capitalize">{profileData.role || 'medlem'}</span>
            </div>
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="grid gap-4 mb-8">
          {/* Role Card */}
          <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Rolle</p>
              <p className="font-medium capitalize">
                {profileRole === 'super_user' ? 'Super Administrator' :
                 profileRole === 'admin' ? 'Administrator' :
                 profileRole === 'range_officer' ? 'Standplassleder' :
                 'Medlem'}
              </p>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
            <Mail className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">E-post</p>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full bg-background border border-border rounded px-3 py-1 mt-1"
                />
              ) : (
                <p className="font-medium">{profileData.email}</p>
              )}
            </div>
          </div>

          {/* Member Number Card */}
          <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
            <Hash className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm text-muted-foreground">Skytte ID</p>
                <a
                  href="https://app.skyting.no/user"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span>Finn din ID</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.memberNumber}
                  onChange={(e) => setEditData({ ...editData, memberNumber: e.target.value })}
                  className="w-full bg-background border border-border rounded px-3 py-1"
                  placeholder="Skriv inn medlemsnummer"
                />
              ) : (
                <p className="font-medium">{profileData.memberNumber || 'Ikke angitt'}</p>
              )}
            </div>
          </div>

          {/* Birth Date Card */}
          <div className="bg-muted/50 p-4 rounded-lg flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Min fødselsdato</p>
              {isEditing ? (
                <div className="mt-1 space-y-2">
                  <DatePicker
                    value={editData.birthDate}
                    onChange={(date: string) => {
                      setEditData(prev => ({ ...prev, birthDate: date }));
                    }}
                    placeholder="Velg fødselsdato"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fødselsdato brukes i treningsloggen og for aldersgrupper
                  </p>
                </div>
              ) : (
                <p className="font-medium">{profileData.birthDate || 'Ikke angitt'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex gap-4">
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
                    Lagre
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
                Avbryt
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