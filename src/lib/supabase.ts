import { createClient } from '@supabase/supabase-js';
import type { 
  Organization, 
  OrganizationMember, 
  SuperUser, 
  TrainingLocation, 
  MemberTrainingSession,
  TrainingSessionDetails,
  SessionTargetImage,
  AuthUser,
  ApiResponse,
  OrganizationBranding
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add missing import and function
export async function getOrganizationMembers(organizationId: string): Promise<ApiResponse<OrganizationMember[]>> {
  try {
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: 'Kunne ikke hente medlemmer' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching organization members:', error);
    return { error: 'Kunne ikke hente medlemmer' };
  }
}

// Check if any super users exist
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

    return (data && data.length > 0);
  } catch (error) {
    console.error('Error checking super users:', error);
    return false;
  }
}

// Create the first super user (only works if no super users exist)
export async function createFirstSuperUser(
  email: string,
  password: string,
  fullName: string
): Promise<ApiResponse<SuperUser>> {
  try {
    // First check if any super users exist
    const superUsersExist = await checkSuperUsersExist();
    if (superUsersExist) {
      return { error: 'Super-brukere eksisterer allerede i systemet' };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'super_user'
        }
      }
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Create super user record
    const { data: superUser, error: superUserError } = await supabase
      .from('super_users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        active: true
      })
      .select()
      .single();

    if (superUserError) {
      return { error: 'Kunne ikke opprette super-bruker profil' };
    }

    return { data: superUser };
  } catch (error) {
    console.error('Error creating first super user:', error);
    return { error: 'Det oppstod en feil ved opprettelse av super-bruker' };
  }
}

// Set user context for RLS
export async function setUserContext(email: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: email,
      is_local: false
    });
  } catch (error) {
    console.warn('Failed to set user context:', error);
  }
}

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return { error: 'Ugyldig e-post eller passord' };
    }

    if (!authData.user) {
      return { error: 'Innlogging feilet' };
    }

    // Set user context for RLS
    await setUserContext(email);

    // Check if user is a super user
    const { data: superUser } = await supabase
      .from('super_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('active', true)
      .single();

    if (superUser) {
      return {
        data: {
          user: {
            id: superUser.id,
            email: superUser.email,
            user_type: 'super_user',
            super_user_profile: superUser
          }
        }
      };
    }

    // Check if user is an organization member
    const { data: member } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('email', email)
      .eq('active', true)
      .single();

    if (member) {
      return {
        data: {
          user: {
            id: member.id,
            email: member.email,
            user_type: 'organization_member',
            organization_id: member.organization_id,
            organization: member.organization,
            member_profile: member
          }
        }
      };
    }

    return { error: 'Bruker ikke funnet eller ikke aktivert' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Det oppstod en feil ved innlogging' };
  }
}

export async function registerOrganizationMember(
  organizationSlug: string,
  email: string,
  password: string,
  fullName: string,
  memberNumber?: string
): Promise<ApiResponse<OrganizationMember>> {
  try {
    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', organizationSlug)
      .eq('active', true)
      .single();

    if (orgError || !organization) {
      return { error: 'Organisasjon ikke funnet' };
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'organization_member'
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return { error: 'E-post er allerede registrert' };
      }
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Kunne ikke opprette bruker' };
    }

    // Create organization member record
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        id: authData.user.id,
        organization_id: organization.id,
        email,
        full_name: fullName,
        member_number: memberNumber,
        approved: false, // Requires admin approval
        active: true
      })
      .select()
      .single();

    if (memberError) {
      if (memberError.code === '23505') {
        return { error: 'E-post eller medlemsnummer er allerede registrert' };
      }
      return { error: 'Kunne ikke registrere medlem' };
    }

    return { data: member };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Det oppstod en feil ved registrering' };
  }
}

// Organization functions
export async function getOrganizationBySlug(slug: string): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) {
      return { error: 'Organisasjon ikke funnet' };
    }

    return { data };
  } catch (error) {
    console.error('Error fetching organization:', error);
    return { error: 'Kunne ikke hente organisasjon' };
  }
}

export async function getOrganizationBranding(organizationId: string): Promise<OrganizationBranding> {
  try {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, primary_color, secondary_color, logo_url')
      .eq('id', organizationId)
      .single();

    return {
      organization_name: org?.name || 'Idrettsklubb',
      primary_color: org?.primary_color || '#FFD700',
      secondary_color: org?.secondary_color || '#1F2937',
      logo_url: org?.logo_url
    };
  } catch (error) {
    console.error('Error fetching branding:', error);
    return {
      organization_name: 'Idrettsklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937'
    };
  }
}

export async function updateOrganizationLogo(organizationId: string, logoFile: File): Promise<ApiResponse<string>> {
  try {
    const fileExt = logoFile.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['svg', 'png', 'jpg', 'jpeg'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: 'Ugyldig filtype. Kun SVG, PNG og JPG er tillatt.' };
    }

    if (logoFile.size > 2 * 1024 * 1024) { // 2MB limit
      return { error: 'Filen er for stor. Maksimal størrelse er 2MB.' };
    }

    const fileName = `${organizationId}-logo-${Date.now()}.${fileExt}`;
    const filePath = `organization-logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(filePath, logoFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { error: 'Kunne ikke laste opp logo' };
    }

    const { data: urlData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    // Update organization
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      return { error: 'Kunne ikke oppdatere organisasjon med ny logo' };
    }

    return { data: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading logo:', error);
    return { error: 'Kunne ikke laste opp logo' };
  }
}

// Training location functions
export async function getTrainingLocationByQR(organizationId: string, qrCodeId: string): Promise<ApiResponse<TrainingLocation>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('qr_code_id', qrCodeId)
      .eq('active', true)
      .single();

    if (error) {
      return { error: 'Ugyldig QR-kode eller lokasjon ikke funnet' };
    }

    return { data };
  } catch (error) {
    console.error('Error fetching training location:', error);
    return { error: 'Kunne ikke finne treningslokasjon' };
  }
}

export async function getOrganizationTrainingLocations(organizationId: string): Promise<ApiResponse<TrainingLocation[]>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name');

    if (error) {
      return { error: 'Kunne ikke hente treningslokasjoner' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching training locations:', error);
    return { error: 'Kunne ikke hente treningslokasjoner' };
  }
}

// Training session functions
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
      .single();

    if (existingSession) {
      return { error: 'Du har allerede registrert trening i dag' };
    }

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
      .select(`
        *,
        member:organization_members(*),
        location:training_locations(*),
        details:training_session_details(*),
        target_images:session_target_images(*)
      `)
      .single();

    if (error) {
      return { error: 'Kunne ikke starte treningsøkt' };
    }

    return { data };
  } catch (error) {
    console.error('Error starting training session:', error);
    return { error: 'Kunne ikke starte treningsøkt' };
  }
}

export async function getMemberTrainingSessions(
  memberId: string,
  limit?: number
): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    let query = supabase
      .from('member_training_sessions')
      .select(`
        *,
        member:organization_members(*),
        location:training_locations(*),
        details:training_session_details(*),
        target_images:session_target_images(*)
      `)
      .eq('member_id', memberId)
      .order('start_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { error: 'Kunne ikke hente treningsøkter' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

export async function getOrganizationTrainingSessions(
  organizationId: string,
  limit?: number
): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    let query = supabase
      .from('member_training_sessions')
      .select(`
        *,
        member:organization_members(*),
        location:training_locations(*),
        details:training_session_details(*),
        target_images:session_target_images(*)
      `)
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      return { error: 'Kunne ikke hente treningsøkter' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error fetching organization training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

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
      return { error: 'Kunne ikke verifisere treningsøkt' };
    }

    return { data };
  } catch (error) {
    console.error('Error verifying training session:', error);
    return { error: 'Kunne ikke verifisere treningsøkt' };
  }
}

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
        end_time: new Date(new Date(sessionData.date).getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        duration_minutes: 120,
        verified: true,
        verified_by: verifiedBy,
        verification_time: new Date().toISOString(),
        manual_entry: true,
        notes: sessionData.notes
      })
      .select(`
        *,
        member:organization_members(*),
        location:training_locations(*),
        details:training_session_details(*),
        target_images:session_target_images(*)
      `)
      .single();

    if (error) {
      return { error: 'Kunne ikke opprette manuell treningsøkt' };
    }

    // Add training details if activity is specified
    if (sessionData.activity) {
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
    return { error: 'Kunne ikke opprette manuell treningsøkt' };
  }
}

// File upload functions
export async function uploadTargetImage(file: File, sessionId: string): Promise<ApiResponse<string>> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: 'Ugyldig filtype. Kun JPG, PNG og GIF er tillatt.' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { error: 'Bildet er for stort. Maksimal størrelse er 5MB.' };
    }

    const fileName = `${sessionId}-${Date.now()}.${fileExt}`;
    const filePath = `target-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('targets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { error: 'Kunne ikke laste opp målbilde' };
    }

    const { data: urlData } = supabase.storage
      .from('targets')
      .getPublicUrl(filePath);

    // Create target image record
    const { error: insertError } = await supabase
      .from('session_target_images')
      .insert({
        session_id: sessionId,
        image_url: urlData.publicUrl,
        filename: file.name
      });

    if (insertError) {
      return { error: 'Kunne ikke lagre målbilde referanse' };
    }

    return { data: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading target image:', error);
    return { error: 'Kunne ikke laste opp målbilde' };
  }
}

export async function uploadMemberDocument(
  file: File, 
  memberId: string, 
  documentType: 'startkort' | 'diploma'
): Promise<ApiResponse<string>> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: 'Ugyldig filtype. Kun PDF og bildefiler er tillatt.' };
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return { error: 'Filen er for stor. Maksimal størrelse er 5MB.' };
    }

    const fileName = `${memberId}-${documentType}-${Date.now()}.${fileExt}`;
    const filePath = `member-documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { error: 'Kunne ikke laste opp dokument' };
    }

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Update member record
    const updateField = documentType === 'startkort' ? 'startkort_url' : 'diploma_url';
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ [updateField]: urlData.publicUrl })
      .eq('id', memberId);

    if (updateError) {
      return { error: 'Kunne ikke oppdatere medlemsprofil' };
    }

    return { data: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading member document:', error);
    return { error: 'Kunne ikke laste opp dokument' };
  }
}

export async function uploadProfileImage(file: File, memberId: string): Promise<ApiResponse<string>> {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
    
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: 'Ugyldig filtype. Kun JPG, PNG og GIF er tillatt.' };
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return { error: 'Bildet er for stort. Maksimal størrelse er 2MB.' };
    }

    const fileName = `${memberId}-avatar-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { error: 'Kunne ikke laste opp profilbilde' };
    }

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update member record
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', memberId);

    if (updateError) {
      return { error: 'Kunne ikke oppdatere medlemsprofil' };
    }

    return { data: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { error: 'Kunne ikke laste opp profilbilde' };
  }
}

export async function updateTrainingDetails(
  sessionId: string,
  details: {
    training_type?: string;
    results?: string;
    notes?: string;
  }
): Promise<ApiResponse<TrainingSessionDetails>> {
  try {
    // Check if training details already exist for this session
    const { data: existingDetails, error: fetchError } = await supabase
      .from('training_session_details')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no details exist yet
      return { error: 'Kunne ikke hente eksisterende treningsdetaljer' };
    }

    let result;
    if (existingDetails) {
      // Update existing record
      const { data, error } = await supabase
        .from('training_session_details')
        .update({
          training_type: details.training_type,
          results: details.results,
          notes: details.notes,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) {
        return { error: 'Kunne ikke oppdatere treningsdetaljer' };
      }
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('training_session_details')
        .insert({
          session_id: sessionId,
          training_type: details.training_type,
          results: details.results,
          notes: details.notes
        })
        .select()
        .single();

      if (error) {
        return { error: 'Kunne ikke opprette treningsdetaljer' };
      }
      result = data;
    }

    return { data: result };
  } catch (error) {
    console.error('Error updating training details:', error);
    return { error: 'Kunne ikke oppdatere treningsdetaljer' };
  }
}

// Organization management functions
export async function createOrganization(orgData: {
  name: string;
  slug: string;
  description?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  primary_color?: string;
  secondary_color?: string;
}): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        ...orgData,
        primary_color: orgData.primary_color || '#FFD700',
        secondary_color: orgData.secondary_color || '#1F2937',
        active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'Organisasjonsnavn eller slug er allerede i bruk' };
      }
      return { error: 'Kunne ikke opprette organisasjon' };
    }

    return { data };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { error: 'Kunne ikke opprette organisasjon' };
  }
}

export async function updateOrganization(
  organizationId: string,
  updates: Partial<Organization>
): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      return { error: 'Kunne ikke oppdatere organisasjon' };
    }

    return { data };
  } catch (error) {
    console.error('Error updating organization:', error);
    return { error: 'Kunne ikke oppdatere organisasjon' };
  }
}

// Member management functions
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
      return { error: 'Kunne ikke godkjenne medlem' };
    }

    return { data };
  } catch (error) {
    console.error('Error approving member:', error);
    return { error: 'Kunne ikke godkjenne medlem' };
  }
}

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
      return { error: 'Kunne ikke oppdatere medlemsrolle' };
    }

    return { data };
  } catch (error) {
    console.error('Error updating member role:', error);
    return { error: 'Kunne ikke oppdatere medlemsrolle' };
  }
}

// Training location management
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
        ...locationData,
        active: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { error: 'QR-kode ID er allerede i bruk' };
      }
      return { error: 'Kunne ikke opprette treningslokasjon' };
    }

    return { data };
  } catch (error) {
    console.error('Error creating training location:', error);
    return { error: 'Kunne ikke opprette treningslokasjon' };
  }
}

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
      return { error: 'Kunne ikke oppdatere treningslokasjon' };
    }

    return { data };
  } catch (error) {
    console.error('Error updating training location:', error);
    return { error: 'Kunne ikke oppdatere treningslokasjon' };
  }
}

// Utility functions for backward compatibility
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if super user
    const { data: superUser } = await supabase
      .from('super_users')
      .select('*')
      .eq('id', user.id)
      .eq('active', true)
      .single();

    if (superUser) {
      return {
        id: superUser.id,
        email: superUser.email,
        user_type: 'super_user',
        super_user_profile: superUser
      };
    }

    // Check if organization member
    const { data: member } = await supabase
      .from('organization_members')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .eq('active', true)
      .single();

    if (member) {
      return {
        id: member.id,
        email: member.email,
        user_type: 'organization_member',
        organization_id: member.organization_id,
        organization: member.organization,
        member_profile: member
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}