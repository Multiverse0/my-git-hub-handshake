import { useState, useCallback, useEffect } from 'react';
import { User, Hash, Calendar, Camera, Pencil, X, Check, Loader2, FileText, Download, Shield } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase, uploadProfileImage, uploadStartkortPDF, uploadDiplomaPDF } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { useToast } from '../hooks/use-toast';

interface ProfileData {
  name: string;
  email: string;
  memberNumber: string;
  joinDate: string;
  birthDate: string;
  avatarUrl?: string;
  startkortUrl?: string;
  startkortFileName?: string;
  diplomaUrl?: string;
  diplomaFileName?: string;
  otherFilesUrl?: string;
  otherFilesFileName?: string;
  organizationName?: string;
  organizationLogo?: string;
  role?: string;
}

export function Profile() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingStartkort, setUploadingStartkort] = useState(false);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [startkortError, setStartkortError] = useState<string | null>(null);
  const [diplomaError, setDiplomaError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    memberNumber: '',
    joinDate: '',
    birthDate: '',
    avatarUrl: undefined,
    startkortUrl: undefined,
    startkortFileName: undefined,
    diplomaUrl: undefined,
    diplomaFileName: undefined
  });
  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Simplified profile data loading - trust AuthContext data
  useEffect(() => {
    const loadProfileData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('🔍 Profile - Waiting for auth to finish loading...');
        return;
      }

      // Check authentication state
      if (!user) {
        console.log('🔍 Profile - No authenticated user');
        toast({
          title: "Authentication Required",
          description: "Please log in to access your profile.",
          variant: "destructive",
        });
        return;
      }

      // Check if user has organization membership
      if (user.user_type !== 'organization_member' || !user.member_profile) {
        console.log('🔍 Profile - User is not an organization member or missing profile:', user.user_type);
        
        if (user.user_type === 'super_user') {
          toast({
            title: "Super User Profile",
            description: "Super users don't have organization member profiles. Please switch to an organization first.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Profile Not Available",
            description: "You need to be an approved organization member to access profile features. Please contact your administrator.",
            variant: "destructive",
          });
        }
        return;
      }

      try {
        setIsLoading(true);
        
        // Use data from AuthContext (already validated and loaded)
        const memberData = user.member_profile;
        const orgData = user.organization;
        
        console.log('🔍 Profile - Using data from AuthContext:', {
          memberName: memberData.full_name,
          memberEmail: memberData.email,
          organization: orgData?.name,
          approved: memberData.approved,
          active: memberData.active
        });

        // Transform data for profile display
        const newProfileData: ProfileData = {
          name: memberData.full_name || '',
          email: memberData.email || '',
          memberNumber: memberData.member_number || '',
          joinDate: memberData.created_at ? new Date(memberData.created_at).toLocaleDateString('nb-NO') : '',
          birthDate: '', // Birth date not available in current schema
          avatarUrl: memberData.avatar_url || undefined,
          startkortUrl: memberData.startkort_url || undefined,
          startkortFileName: memberData.startkort_file_name || undefined,
          diplomaUrl: memberData.diploma_url || undefined,
          diplomaFileName: memberData.diploma_file_name || undefined,
          organizationName: orgData?.name || 'Unknown Organization',
          organizationLogo: orgData?.logo_url || undefined,
          role: memberData.role || 'member',
        };
        
        setProfileData(newProfileData);
        setEditData(newProfileData);
        
        console.log('✅ Profile data loaded from AuthContext successfully');
        
      } catch (error) {
        console.error('❌ Error processing profile data from AuthContext:', error);
        toast({
          title: "Error Loading Profile",
          description: "There was an issue processing your profile data. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user, authLoading, toast]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    if (!user?.id || !user.member_profile?.id) {
      console.error('❌ No user ID available for avatar upload');
      return;
    }

    try {
      setIsLoading(true);
      const file = acceptedFiles[0];
      const imageUrl = await uploadProfileImage(file, user.member_profile.id);
      
      // Update profile with new avatar URL
      const { error } = await supabase
        .from('organization_members')
        .update({ avatar_url: imageUrl })
        .eq('id', user.member_profile.id);

      if (error) throw error;

      // Update local state
      setProfileData(prev => ({ ...prev, avatarUrl: imageUrl }));
      setEditData(prev => ({ ...prev, avatarUrl: imageUrl }));

      toast({
        title: "Success",
        description: "Profile picture updated successfully.",
      });
      
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Could not upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleSave = async () => {
    if (!user?.member_profile?.id) {
      toast({
        title: "Error",
        description: "No profile ID available. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!editData.name?.trim()) {
        throw new Error('Name is required');
      }
      
      if (!editData.email?.trim()) {
        throw new Error('Email is required');
      }
      
      // Parse birth date if provided
      let birthDateISO = null;
      if (editData.birthDate?.trim()) {
        try {
          let day, month, year;
          
          if (editData.birthDate.includes('.')) {
            [day, month, year] = editData.birthDate.split('.');
          } else if (editData.birthDate.includes('/')) {
            [day, month, year] = editData.birthDate.split('/');
          } else if (editData.birthDate.includes('-')) {
            const parts = editData.birthDate.split('-');
            if (parts.length === 3 && parts[0].length === 4) {
              year = parts[0];
              month = parts[1];
              day = parts[2];
            }
          }
          
          if (day && month && year) {
            const dayNum = parseInt(day, 10);
            const monthNum = parseInt(month, 10);
            const yearNum = parseInt(year, 10);
            
            if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
              throw new Error('Invalid birth date');
            }
            
            birthDateISO = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
            
            const testDate = new Date(birthDateISO);
            if (isNaN(testDate.getTime())) {
              throw new Error('Invalid birth date format');
            }
          }
        } catch (dateError) {
          console.warn('Could not parse birth date:', editData.birthDate, dateError);
          throw new Error('Invalid birth date. Use format DD.MM.YYYY');
        }
      }

      // Update profile
      const updateData = {
        full_name: editData.name.trim(),
        email: editData.email.trim(),
        member_number: editData.memberNumber?.trim() || null,
        birth_date: birthDateISO,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('organization_members')
        .update(updateData)
        .eq('id', user.member_profile.id)
        .select();

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No profile was updated. Please ensure your profile exists and try again.');
      }

      // Update local state
      const updatedProfile = { ...editData };
      if (birthDateISO) {
        const birthDate = new Date(birthDateISO);
        updatedProfile.birthDate = birthDate.toLocaleDateString('nb-NO');
      }
      
      setProfileData(updatedProfile);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profileData);
    setIsEditing(false);
  };

  // Handle file uploads (simplified)
  const handleStartkortUpload = useCallback(async (files: File[]) => {
    if (!files.length || !user?.member_profile?.id) return;

    try {
      setUploadingStartkort(true);
      setStartkortError(null);
      
      const file = files[0];
      const fileUrl = await uploadStartkortPDF(file, user.member_profile.id);
      
      const { error } = await supabase
        .from('organization_members')
        .update({ 
          startkort_url: fileUrl,
          startkort_file_name: file.name
        })
        .eq('id', user.member_profile.id);

      if (error) throw error;

      setProfileData(prev => ({ 
        ...prev, 
        startkortUrl: fileUrl,
        startkortFileName: file.name
      }));
      
      toast({
        title: "Success",
        description: "Startkort uploaded successfully.",
      });

    } catch (error) {
      console.error('Error uploading startkort:', error);
      setStartkortError(error instanceof Error ? error.message : 'Upload failed');
      toast({
        title: "Error",
        description: "Could not upload startkort. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingStartkort(false);
    }
  }, [user, toast]);

  const handleDiplomaUpload = useCallback(async (files: File[]) => {
    if (!files.length || !user?.member_profile?.id) return;

    try {
      setUploadingDiploma(true);
      setDiplomaError(null);
      
      const file = files[0];
      const fileUrl = await uploadDiplomaPDF(file, user.member_profile.id);
      
      const { error } = await supabase
        .from('organization_members')
        .update({ 
          diploma_url: fileUrl,
          diploma_file_name: file.name
        })
        .eq('id', user.member_profile.id);

      if (error) throw error;

      setProfileData(prev => ({ 
        ...prev, 
        diplomaUrl: fileUrl,
        diplomaFileName: file.name
      }));
      
      toast({
        title: "Success",
        description: "Member card uploaded successfully.",
      });

    } catch (error) {
      console.error('Error uploading diploma:', error);
      setDiplomaError(error instanceof Error ? error.message : 'Upload failed');
      toast({
        title: "Error",
        description: "Could not upload member card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingDiploma(false);
    }
  }, [user, toast]);

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please log in to access your profile.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show profile access error
  if (user.user_type !== 'organization_member' || !user.member_profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Profile Not Available</h1>
          {user.user_type === 'super_user' ? (
            <p className="text-muted-foreground mb-4">Super users don't have organization member profiles. Please switch to an organization first.</p>
          ) : (
            <p className="text-muted-foreground mb-4">You need to be an approved organization member to access profile features. Please contact your administrator.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-muted-foreground">{profileData.organizationName}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Profile Content */}
        <div className="bg-card rounded-lg shadow-sm border p-6">
          {/* Profile Picture Section */}
          <div className="flex items-start space-x-6 mb-8">
            <div className="relative">
              <div 
                {...getRootProps()} 
                className={`w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} />
                {profileData.avatarUrl ? (
                  <img 
                    src={profileData.avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {isLoading && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">{profileData.name}</h2>
              <p className="text-muted-foreground mb-2">{profileData.email}</p>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Hash className="h-4 w-4 mr-1" />
                  {profileData.memberNumber || 'No member number'}
                </span>
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {profileData.joinDate}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  />
                ) : (
                  <p className="text-muted-foreground">{profileData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  />
                ) : (
                  <p className="text-muted-foreground">{profileData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Member Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.memberNumber}
                    onChange={(e) => setEditData(prev => ({ ...prev, memberNumber: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                ) : (
                  <p className="text-muted-foreground">{profileData.memberNumber || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Birth Date</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.birthDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, birthDate: e.target.value }))}
                    placeholder="DD.MM.YYYY"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                ) : (
                  <p className="text-muted-foreground">{profileData.birthDate || 'Not set'}</p>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Documents</h3>
              
              {/* Startkort */}
              <div>
                <label className="block text-sm font-medium mb-2">Startkort</label>
                {profileData.startkortUrl ? (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{profileData.startkortFileName || 'Startkort.pdf'}</span>
                    <a 
                      href={profileData.startkortUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No startkort uploaded</p>
                )}
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files && handleStartkortUpload(Array.from(e.target.files))}
                  className="mt-2 text-sm"
                  disabled={uploadingStartkort}
                />
                {uploadingStartkort && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                {startkortError && <p className="text-sm text-destructive mt-1">{startkortError}</p>}
              </div>

              {/* Member Card */}
              <div>
                <label className="block text-sm font-medium mb-2">Member Card</label>
                {profileData.diplomaUrl ? (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">{profileData.diplomaFileName || 'Member-card.pdf'}</span>
                    <a 
                      href={profileData.diplomaUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No member card uploaded</p>
                )}
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files && handleDiplomaUpload(Array.from(e.target.files))}
                  className="mt-2 text-sm"
                  disabled={uploadingDiploma}
                />
                {uploadingDiploma && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                {diplomaError && <p className="text-sm text-destructive mt-1">{diplomaError}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}