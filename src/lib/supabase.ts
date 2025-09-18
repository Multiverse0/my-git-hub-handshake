// This file provides a comprehensive interface for interacting with a Supabase backend, handling authentication, organization management, member management, training sessions, and file uploads.

import { supabase } from '../integrations/supabase/client';

// Export supabase for other components
export { supabase };

// Types imported from types.ts
import type {
  ApiResponse,
  AuthUser,
  SuperUser,
  Organization,
  OrganizationAdmin,
  OrganizationBranding,
  OrganizationMember, 
  MemberTrainingSession,
  TrainingLocation
} from './types';
import { sendMemberWelcomeEmail } from './emailService';

// =============================================================================
// USER CONTEXT AND AUTHENTICATION
// =============================================================================

/**
 * Set user context for RLS policies
 */
export async function setUserContext(email: string): Promise<void> {
  try {
    await supabase.rpc('set_user_context', { user_email: email });
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}

/**
 * Get currently logged in user with profile data
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return null;
    }

    // Set user context for database queries
    await setUserContext(user.email!);

    // Check if user is a super user
    const { data: superUserData } = await supabase
      .from('super_users')
      .select('*')
      .eq('email', user.email!)
      .eq('active', true)
      .maybeSingle();

    if (superUserData) {
      return {
        id: user.id,
        email: user.email!,
        user_type: 'super_user',
        super_user_profile: superUserData
      };
    }

    // Check if user is an organization member
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', user.email!)
      .eq('approved', true)
      .eq('active', true)
      .maybeSingle();

    if (memberData) {
      // Get organization data
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', memberData.organization_id)
        .single();
      
      return {
        id: memberData.id,
        email: user.email!,
        user_type: 'organization_member',
        organization_id: memberData.organization_id,
        organization: orgData || undefined,
        member_profile: memberData
      };
    }

    // Regular auth user without organization membership
    return {
      id: user.id,
      email: user.email!,
      user_type: 'organization_member'
    };

  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Ingen bruker returnert' };
    }

    // Get full user data
    const user = await getCurrentUser();
    if (!user) {
      return { error: 'Kunne ikke hente brukerdata' };
    }

    return { data: { user } };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { error: 'Autentisering feilet' };
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

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking super users:', error);
    return false;
  }
}

/**
 * Create the first super user (system initialization)
 */
export async function createFirstSuperUser(
  email: string,
  password: string,
  fullName: string
): Promise<ApiResponse<SuperUser>> {
  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Then create the super user record
    const { data: superUserData, error: superUserError } = await supabase
      .from('super_users')
      .insert({
        email,
        full_name: fullName
      })
      .select()
      .single();

    if (superUserError) {
      return { error: superUserError.message };
    }

    return { data: superUserData };
  } catch (error) {
    console.error('Error creating first super user:', error);
    return { error: 'Kunne ikke opprette superbruker' };
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

    return { data: data as any } as ApiResponse<Organization>;
  } catch (error) {
    console.error('Error getting organization by slug:', error);
    return { error: 'Kunne ikke hente organisasjon' };
  }
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: 'Organisasjon ikke funnet' };
    }

    return { data: data as any } as ApiResponse<Organization>;
  } catch (error) {
    console.error('Error getting organization by ID:', error);
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
      .select('name, primary_color, secondary_color, logo_url, background_color, nsf_enabled, dfs_enabled, dssn_enabled, activity_types')
      .eq('id', organizationId)
      .maybeSingle();

    if (data) {
      return {
        organization_name: data.name || 'Idrettsklubb',
        primary_color: data.primary_color || '#FFD700',
        secondary_color: data.secondary_color || '#1F2937',
        background_color: data.background_color || '#FFFFFF',
        logo_url: data.logo_url,
        nsf_enabled: data.nsf_enabled !== false,
        dfs_enabled: data.dfs_enabled !== false,
        dssn_enabled: data.dssn_enabled !== false,
        activity_types: data.activity_types || ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun']
      };
    }

    // Fallback branding
    return {
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937',
      background_color: '#FFFFFF',
      nsf_enabled: true,
      dfs_enabled: true,
      dssn_enabled: true,
      activity_types: ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun']
    };
  } catch (error) {
    console.error('Error getting organization branding:', error);
    return {
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937',
      background_color: '#FFFFFF',
      nsf_enabled: true,
      dfs_enabled: true,
      dssn_enabled: true,
      activity_types: ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun']
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
        name: orgData.name || '',
        slug: orgData.slug || '',
        description: orgData.description,
        email: orgData.email,
        phone: orgData.phone,
        website: orgData.website,
        address: orgData.address,
        primary_color: orgData.primary_color || '#FFD700',
        secondary_color: orgData.secondary_color || '#1F2937',
        background_color: orgData.background_color || '#FFFFFF',
        nsf_enabled: orgData.nsf_enabled !== false,
        dfs_enabled: orgData.dfs_enabled !== false,
        dssn_enabled: orgData.dssn_enabled !== false,
        activity_types: orgData.activity_types || ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun']
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any } as ApiResponse<Organization>;
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

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  organizationId: string,
  settings: Partial<Organization>
): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('organizations')
      .update(settings)
      .eq('id', organizationId);

    if (error) {
      return { error: error.message };
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return { error: 'Kunne ikke oppdatere innstillinger' };
  }
}

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
    // First, get the organization
    const orgResult = await getOrganizationBySlug(organizationSlug);
    if (orgResult.error || !orgResult.data) {
      return { error: orgResult.error || 'Organisasjon ikke funnet' };
    }

    const organization = orgResult.data;

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Create organization member
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organization.id,
        email,
        full_name: fullName,
        member_number: memberNumber,
        role,
        approved: false // Requires approval by admin
      })
      .select()
      .single();

    if (memberError) {
      return { error: memberError.message };
    }

    // Send welcome email to new member
    try {
      await sendMemberWelcomeEmail(
        email,
        fullName,
        organization.name,
        organization.id,
        memberNumber
      );
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Could not send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return { data: memberData as any };
  } catch (error) {
    console.error('Error registering organization member:', error);
    return { error: 'Kunne ikke registrere medlem' };
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
      .order('full_name');

    if (error) {
      return { error: error.message };
    }

  return { data: data as any[] };
  } catch (error) {
    console.error('Error getting organization members:', error);
    return { error: 'Kunne ikke hente medlemmer' };
  }
}

/**
 * Get organization admins with proper relationship data
 */
export async function getOrganizationAdmins(organizationId: string): Promise<ApiResponse<OrganizationAdmin[]>> {
  try {
    const { data, error } = await supabase
      .rpc('get_organization_admins', { org_id: organizationId });

    if (error) {
      return { error: error.message };
    }

    return { data: data as any[] };
  } catch (error) {
    console.error('Error getting organization admins:', error);
    return { error: 'Kunne ikke hente administratorer' };
  }
}

/**
 * Approve organization member
 */
export async function approveMember(memberId: string): Promise<ApiResponse<OrganizationMember>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .update({ approved: true })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
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
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { error: 'Kunne ikke oppdatere rolle' };
  }
}

/**
 * Add organization member (admin function)
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
    // If password is provided, create auth user
    if (memberData.password) {
      const { error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password,
        options: {
          data: {
            full_name: memberData.full_name
          }
        }
      });

      if (authError) {
        return { error: authError.message };
      }
    }

    // Create organization member (trigger will automatically create admin record if role is admin)
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        email: memberData.email,
        full_name: memberData.full_name,
        member_number: memberData.member_number,
        role: memberData.role,
        approved: memberData.approved
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
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
      .update(updates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
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
// TRAINING SESSION AND LOCATION MANAGEMENT
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
      return { error: 'Treningssted ikke funnet' };
    }

    return { data: data as any };
  } catch (error) {
    console.error('Error getting training location by QR:', error);
    return { error: 'Kunne ikke hente treningssted' };
  }
}

/**
 * Start new training session
 */
export async function startTrainingSession(
  organizationId: string,
  memberId: string,
  locationId: string,
  discipline?: string
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    // Check for existing training session today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingSessions, error: checkError } = await supabase
      .from('member_training_sessions')
      .select('id, discipline')
      .eq('organization_id', organizationId)
      .eq('member_id', memberId)
      .eq('location_id', locationId)
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString());

    if (checkError) {
      return { error: checkError.message };
    }

    if (existingSessions && existingSessions.length > 0) {
      return { error: 'Du har allerede registrert trening på denne lokasjonen i dag' };
    }

    // Get location details to determine correct discipline
    const { data: location, error: locationError } = await supabase
      .from('training_locations')
      .select('nsf_enabled, dfs_enabled, dssn_enabled')
      .eq('id', locationId)
      .single();

    if (locationError) {
      return { error: 'Kunne ikke hente treningssted informasjon' };
    }

    // Determine discipline if not provided
    let finalDiscipline = discipline;
    if (!finalDiscipline) {
      const enabledDisciplines = [];
      if (location.nsf_enabled) enabledDisciplines.push('NSF');
      if (location.dfs_enabled) enabledDisciplines.push('DFS');
      if (location.dssn_enabled) enabledDisciplines.push('DSSN');
      
      // Use the first enabled discipline, or NSF as default
      finalDiscipline = enabledDisciplines[0] || 'NSF';
    }

    const { data, error } = await supabase
      .from('member_training_sessions')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        location_id: locationId,
        discipline: finalDiscipline,
        start_time: new Date().toISOString(),
        verified: false
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
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
        training_locations(name),
        training_session_details(training_type, results, notes),
        session_target_images(image_url, filename)
      `)
      .eq('member_id', memberId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    // Transform the data to include details and target images
    const transformedData = data.map(session => ({
      ...session,
      location_name: session.training_locations?.name || 'Ukjent',
      details: session.training_session_details?.[0] || {},
      target_images: session.session_target_images?.map(img => img.image_url) || []
    }));

    return { data: transformedData as any[] };
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
        organization_members(full_name, member_number),
        training_locations(name)
      `)
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: data as any[] };
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
        verification_time: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
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
  }
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        location_id: locationId,
        start_time: sessionData.date,
        end_time: sessionData.date,
        notes: sessionData.notes,
        verified: false,
        manual_entry: true
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    console.error('Error adding manual training session:', error);
    return { error: 'Kunne ikke legge til manuell treningsøkt' };
  }
}

/**
 * Update training details
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
    // First, check if details already exist
    const { data: existingDetails } = await supabase
      .from('training_session_details')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existingDetails) {
      // Update existing details
      const { error } = await supabase
        .from('training_session_details')
        .update(details)
        .eq('session_id', sessionId);

      if (error) {
        return { error: error.message };
      }
    } else {
      // Insert new details
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

/**
 * Get organization training locations
 */
export async function getOrganizationTrainingLocations(organizationId: string): Promise<ApiResponse<TrainingLocation[]>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name');

    if (error) {
      return { error: error.message };
    }

    return { data: data as any[] };
  } catch (error) {
    console.error('Error getting organization training locations:', error);
    return { error: 'Kunne ikke hente treningssteder' };
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
    nsf_enabled?: boolean;
    dfs_enabled?: boolean;
    dssn_enabled?: boolean;
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
        nsf_enabled: locationData.nsf_enabled ?? true,
        dfs_enabled: locationData.dfs_enabled ?? false,
        dssn_enabled: locationData.dssn_enabled ?? false
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    console.error('Error creating training location:', error);
    return { error: 'Kunne ikke opprette treningssted' };
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
      .update(updates)
      .eq('id', locationId)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as any };
  } catch (error) {
    console.error('Error updating training location:', error);
    return { error: 'Kunne ikke oppdatere treningssted' };
  }
}

// =============================================================================
// FILE UPLOADS
// =============================================================================

/**
 * Upload profile image
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `profiles/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload startkort PDF
 */
export async function uploadStartkortPDF(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-startkort-${Date.now()}.${fileExt}`;
  const filePath = `documents/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload diploma PDF
 */
export async function uploadDiplomaPDF(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-diploma-${Date.now()}.${fileExt}`;
  const filePath = `documents/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * Upload target image for training session
 */
export async function uploadTargetImage(file: File, sessionId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${sessionId}-target-${Date.now()}.${fileExt}`;
  const filePath = `target-images/${sessionId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('target-images')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('target-images')
    .getPublicUrl(filePath);

  // Also save reference in the database
  await supabase
    .from('session_target_images')
    .insert({
      session_id: sessionId,
      image_url: publicUrl,
      filename: file.name
    });

  return publicUrl;
}

// =============================================================================
// UTILITY AND STATUS FUNCTIONS
// =============================================================================

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

/**
 * Get Supabase service status
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

    // Test auth service
    const { error: authError } = await supabase.auth.getSession();

    // Test storage
    const { error: storageError } = await supabase.storage
      .from('profiles')
      .list('', { limit: 1 });

    return {
      connected: true,
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
// DEMO MODE FUNCTIONS
// =============================================================================

/**
 * Check if running in demo mode
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
    name: 'Demo Skytterklubb',
    slug: 'demo',
    description: 'Dette er en demo-organisasjon for testing',
    email: 'post@demo.no',
    phone: '+47 123 45 678',
    website: 'https://demo.no',
    address: 'Demogate 1, 0123 Demo',
    primary_color: '#FFD700',
    secondary_color: '#1F2937',
    background_color: '#FFFFFF',
    nsf_enabled: true,
    dfs_enabled: true,
    dssn_enabled: true,
    activity_types: ['NSF', 'DFS', 'DSSN', 'Pistol', 'Rifle', 'Shotgun'],
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
