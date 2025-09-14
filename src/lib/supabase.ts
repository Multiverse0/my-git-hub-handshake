import { createClient } from '@supabase/supabase-js';
import type { 
  AuthUser, 
  Organization, 
  OrganizationMember, 
  SuperUser,
  MemberTrainingSession,
  TrainingLocation,
  OrganizationBranding,
  ApiResponse
} from './types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Using demo mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-key'
);

// =============================================================================
// AUTHENTICATION FUNCTIONS
// =============================================================================

/**
 * Set user context for Row Level Security (RLS)
 */
export async function setUserContext(email: string): Promise<void> {
  try {
    await supabase.rpc('set_user_context', { user_email: email });
  } catch (error) {
    // Silently handle missing RLS function - it's optional for basic functionality
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST202') {
      console.warn('RLS function set_user_context not found. Please run the create_rls_functions.sql migration.');
    } else {
      console.warn('Could not set user context:', error);
    }
  }
}

/**
 * Get current authenticated user with profile data
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Check if user is a super user
    const { data: superUser } = await supabase
      .from('super_users')
      .select('*')
      .eq('email', user.email)
      .eq('active', true)
      .maybeSingle();

    if (superUser) {
      return {
        id: user.id,
        email: user.email!,
        user_type: 'super_user',
        super_user_profile: superUser
      };
    }

    // Check if user is an organization member
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('email', user.email)
      .eq('active', true)
      .maybeSingle();

    if (orgMember) {
      return {
        id: user.id,
        email: user.email!,
        user_type: 'organization_member',
        organization_id: orgMember.organization_id,
        organization: orgMember.organizations,
        member_profile: orgMember
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string, 
  password: string
): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Innlogging feilet' };
    }

    // Get user profile data
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { error: 'Bruker ikke funnet i systemet' };
    }

    return { data: { user: currentUser } };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Det oppstod en feil ved innlogging' };
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Check if any super users exist in the system
 */
export async function checkSuperUsersExist(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('super_users')
      .select('id')
      .eq('active', true)
      .limit(1);

    if (error) {
      console.error('Error checking super users:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking super users:', error);
    return false;
  }
}

/**
 * Create the first super user (system setup)
 */
export async function createFirstSuperUser(
  email: string,
  password: string,
  fullName: string
): Promise<ApiResponse<SuperUser>> {
  try {
    // Check if super users already exist
    const superUsersExist = await checkSuperUsersExist();
    if (superUsersExist) {
      return { error: 'Super-brukere eksisterer allerede i systemet' };
    }

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Create super user record
    const { data: superUser, error: insertError } = await supabase
      .from('super_users')
      .insert({
        email,
        full_name: fullName,
        active: true
      })
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    return { data: superUser };
  } catch (error) {
    console.error('Error creating first super user:', error);
    return { error: 'Det oppstod en feil ved opprettelse av super-bruker' };
  }
}

// =============================================================================
// ORGANIZATION FUNCTIONS
// =============================================================================

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: 'Organisasjon ikke funnet' };
    }

    return { data };
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return { error: 'Kunne ikke hente organisasjon' };
  }
}

/**
 * Get organization branding information
 */
export async function getOrganizationBranding(organizationId: string): Promise<OrganizationBranding> {
  try {
    const { data } = await supabase
      .from('organizations')
      .select('name, primary_color, secondary_color, logo_url')
      .eq('id', organizationId)
      .maybeSingle();

    if (data) {
      return {
        organization_name: data.name,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        logo_url: data.logo_url
      };
    }

    // Fallback branding
    return {
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937'
    };
  } catch (error) {
    console.error('Error getting organization branding:', error);
    return {
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937'
    };
  }
}

/**
 * Create new organization
 */
export async function createOrganization(orgData: Partial<Organization>): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name,
        slug: orgData.slug,
        description: orgData.description,
        email: orgData.email,
        phone: orgData.phone,
        website: orgData.website,
        address: orgData.address,
        primary_color: orgData.primary_color || '#FFD700',
        secondary_color: orgData.secondary_color || '#1F2937',
        active: true
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { error: 'Kunne ikke opprette organisasjon' };
  }
}

/**
 * Update organization logo
 */
export async function updateOrganizationLogo(
  organizationId: string, 
  logoFile: File
): Promise<ApiResponse<string>> {
  try {
    // Upload logo to storage
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${organizationId}-logo.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, logoFile, {
        upsert: true
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(uploadData.path);

    // Update organization record
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { data: publicUrl };
  } catch (error) {
    console.error('Error updating organization logo:', error);
    return { error: 'Kunne ikke oppdatere logo' };
  }
}

// =============================================================================
// MEMBER MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Register new organization member
 */
export async function registerOrganizationMember(
  organizationSlug: string,
  email: string,
  password: string,
  fullName: string,
  memberNumber?: string,
  role: 'member' | 'admin' | 'range_officer' = 'member'
): Promise<ApiResponse<OrganizationMember>> {
  try {
    // Get organization
    const orgResult = await getOrganizationBySlug(organizationSlug);
    if (orgResult.error || !orgResult.data) {
      return { error: orgResult.error || 'Organisasjon ikke funnet' };
    }

    const organization = orgResult.data;

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Create organization member record
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        email,
        full_name: fullName,
        member_number: memberNumber,
        role,
        approved: role === 'admin', // Auto-approve admins
        active: true
      })
      .select()
      .single();

    if (memberError) {
      return { error: memberError.message };
    }

    return { data: member };
  } catch (error) {
    console.error('Error registering organization member:', error);
    return { error: 'Det oppstod en feil ved registrering' };
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(organizationId: string): Promise<ApiResponse<OrganizationMember[]>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting organization members:', error);
    return { error: 'Kunne ikke hente medlemmer' };
  }
}

/**
 * Approve organization member
 */
export async function approveMember(memberId: string): Promise<ApiResponse<OrganizationMember>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ 
        approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error approving member:', error);
    return { error: 'Kunne ikke godkjenne medlem' };
  }
}

/**
 * Update member role
 */
export async function updateMemberRole(
  memberId: string, 
  role: 'member' | 'admin' | 'range_officer'
): Promise<ApiResponse<OrganizationMember>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { error: 'Kunne ikke oppdatere medlemsrolle' };
  }
}

/**
 * Add new organization member (admin function)
 */
export async function addOrganizationMember(
  organizationId: string,
  memberData: {
    email: string;
    full_name: string;
    member_number?: string;
    role: 'member' | 'admin' | 'range_officer';
    approved: boolean;
    password?: string;
  }
): Promise<ApiResponse<OrganizationMember>> {
  try {
    // If password is provided, create auth user first
    if (memberData.password) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password
      });

      if (authError) {
        return { error: authError.message };
      }
    }

    // Create organization member record
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        email: memberData.email,
        full_name: memberData.full_name,
        member_number: memberData.member_number,
        role: memberData.role,
        approved: memberData.approved,
        active: true
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error adding organization member:', error);
    return { error: 'Kunne ikke legge til medlem' };
  }
}

/**
 * Update organization member
 */
export async function updateOrganizationMember(
  memberId: string,
  updates: Partial<OrganizationMember>
): Promise<ApiResponse<OrganizationMember>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error updating organization member:', error);
    return { error: 'Kunne ikke oppdatere medlem' };
  }
}

/**
 * Delete organization member
 */
export async function deleteOrganizationMember(memberId: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return { error: error.message };
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error deleting organization member:', error);
    return { error: 'Kunne ikke slette medlem' };
  }
}

// =============================================================================
// TRAINING SESSION FUNCTIONS
// =============================================================================

/**
 * Get training location by QR code
 */
export async function getTrainingLocationByQR(
  organizationId: string,
  qrCode: string
): Promise<ApiResponse<TrainingLocation>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('qr_code_id', qrCode)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: 'Treningslokasjon ikke funnet' };
    }

    return { data };
  } catch (error) {
    console.error('Error getting training location by QR:', error);
    return { error: 'Kunne ikke finne treningslokasjon' };
  }
}

/**
 * Start training session
 */
export async function startTrainingSession(
  organizationId: string,
  memberId: string,
  locationId: string
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    // Check if member already has a session today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSession } = await supabase
      .from('member_training_sessions')
      .select('id')
      .eq('member_id', memberId)
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)
      .maybeSingle();

    if (existingSession) {
      return { error: 'Du har allerede registrert trening i dag' };
    }

    // Create new training session
    const { data, error } = await supabase
      .from('member_training_sessions')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        location_id: locationId,
        start_time: new Date().toISOString(),
        verified: false,
        manual_entry: false
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error starting training session:', error);
    return { error: 'Kunne ikke starte treningsøkt' };
  }
}

/**
 * Get member training sessions
 */
export async function getMemberTrainingSessions(memberId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .select(`
        *,
        organization_members!inner(*),
        training_locations(*),
        training_session_details(*),
        session_target_images(*)
      `)
      .eq('member_id', memberId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting member training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

/**
 * Get organization training sessions
 */
export async function getOrganizationTrainingSessions(organizationId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .select(`
        *,
        organization_members(*),
        training_locations(*),
        training_session_details(*),
        session_target_images(*)
      `)
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting organization training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

/**
 * Verify training session
 */
export async function verifyTrainingSession(
  sessionId: string,
  verifiedBy: string
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .update({
        verified: true,
        verified_by: verifiedBy,
        verification_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error verifying training session:', error);
    return { error: 'Kunne ikke verifisere treningsøkt' };
  }
}

/**
 * Add manual training session
 */
export async function addManualTrainingSession(
  organizationId: string,
  memberId: string,
  locationId: string,
  sessionData: {
    date: string;
    activity: string;
    notes?: string;
  },
  verifiedBy: string
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        location_id: locationId,
        start_time: new Date(sessionData.date).toISOString(),
        verified: true,
        verified_by: verifiedBy,
        verification_time: new Date().toISOString(),
        manual_entry: true,
        notes: sessionData.notes
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    // Add training details if activity is specified
    if (sessionData.activity !== 'Trening') {
      await supabase
        .from('training_session_details')
        .insert({
          session_id: data.id,
          training_type: sessionData.activity,
          notes: sessionData.notes
        });
    }

    return { data };
  } catch (error) {
    console.error('Error adding manual training session:', error);
    return { error: 'Kunne ikke legge til manuell treningsøkt' };
  }
}

/**
 * Update training session details
 */
export async function updateTrainingDetails(
  sessionId: string,
  details: {
    training_type?: string;
    results?: string;
    notes?: string;
  }
): Promise<ApiResponse<void>> {
  try {
    // Check if details already exist
    const { data: existingDetails } = await supabase
      .from('training_session_details')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingDetails) {
      // Update existing
      const { error } = await supabase
        .from('training_session_details')
        .update({
          ...details,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);

      if (error) {
        return { error: error.message };
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('training_session_details')
        .insert({
          session_id: sessionId,
          ...details
        });

      if (error) {
        return { error: error.message };
      }
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error updating training details:', error);
    return { error: 'Kunne ikke oppdatere treningsdetaljer' };
  }
}

// =============================================================================
// TRAINING LOCATION FUNCTIONS
// =============================================================================

/**
 * Get organization training locations
 */
export async function getOrganizationTrainingLocations(organizationId: string): Promise<ApiResponse<TrainingLocation[]>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      return { error: error.message };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting training locations:', error);
    return { error: 'Kunne ikke hente treningslokasjoner' };
  }
}

/**
 * Create training location
 */
export async function createTrainingLocation(
  organizationId: string,
  locationData: {
    name: string;
    qr_code_id: string;
    description?: string;
  }
): Promise<ApiResponse<TrainingLocation>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .insert({
        organization_id: organizationId,
        name: locationData.name,
        qr_code_id: locationData.qr_code_id,
        description: locationData.description,
        active: true
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error creating training location:', error);
    return { error: 'Kunne ikke opprette treningslokasjon' };
  }
}

/**
 * Update training location
 */
export async function updateTrainingLocation(
  locationId: string,
  updates: Partial<TrainingLocation>
): Promise<ApiResponse<TrainingLocation>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error updating training location:', error);
    return { error: 'Kunne ikke oppdatere treningslokasjon' };
  }
}

// =============================================================================
// FILE UPLOAD FUNCTIONS
// =============================================================================

/**
 * Upload profile image
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
}

/**
 * Upload startkort PDF
 */
export async function uploadStartkortPDF(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `startkort-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `startkort/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading startkort:', error);
    throw error;
  }
}

/**
 * Upload diploma/member card PDF
 */
export async function uploadDiplomaPDF(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `diploma-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `diplomas/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading diploma:', error);
    throw error;
  }
}

/**
 * Upload target image for training session
 */
export async function uploadTargetImage(file: File, sessionId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `target-${sessionId}-${Date.now()}.${fileExt}`;
    const filePath = `target-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('target-images')
      .upload(filePath, file);

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('target-images')
      .getPublicUrl(data.path);

    // Save reference in database
    await supabase
      .from('session_target_images')
      .insert({
        session_id: sessionId,
        image_url: publicUrl,
        filename: file.name
      });

    return publicUrl;
  } catch (error) {
    console.error('Error uploading target image:', error);
    throw error;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'https://demo.supabase.co' && 
           supabaseAnonKey !== 'demo-key');
}

/**
 * Get Supabase connection status
 */
export async function getSupabaseStatus(): Promise<{
  connected: boolean;
  database: boolean;
  auth: boolean;
  storage: boolean;
}> {
  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    // Test auth
    const { error: authError } = await supabase.auth.getSession();

    // Test storage
    const { error: storageError } = await supabase.storage.listBuckets();

    return {
      connected: !dbError && !authError && !storageError,
      database: !dbError,
      auth: !authError,
      storage: !storageError
    };
  } catch (error) {
    return {
      connected: false,
      database: false,
      auth: false,
      storage: false
    };
  }
}

// =============================================================================
// DEMO/FALLBACK FUNCTIONS
// =============================================================================

/**
 * Demo mode fallback for when Supabase is not configured
 */
export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

/**
 * Get demo organization data
 */
export function getDemoOrganization(): Organization {
  return {
    id: 'demo-org-id',
    name: 'Svolvær Pistolklubb',
    slug: 'svpk',
    description: 'Demo organisasjon for AKTIVLOGG',
    email: 'post@svpk.no',
    phone: '+47 123 45 678',
    website: 'https://svpk.no',
    address: 'Svolværgata 1, 8300 Svolvær',
    primary_color: '#FFD700',
    secondary_color: '#1F2937',
    logo_url: undefined,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// Export default client for direct usage if needed
export default supabase;