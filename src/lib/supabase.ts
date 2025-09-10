import { createClient } from '@supabase/supabase-js';
import type { 
  Organization, 
  OrganizationMember, 
  AuthUser, 
  OrganizationBranding, 
  TrainingLocation,
  MemberTrainingSession,
  TrainingSessionDetails,
  ApiResponse,
  SuperUser
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set user context for RLS policies
export async function setUserContext(email: string): Promise<void> {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_user_email',
      setting_value: email,
      is_local: false
    });
  } catch (error) {
    console.error('Error setting user context:', error);
  }
}

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    console.log('🔐 Authenticating user:', email);
    
    // Try Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (!authError && authData.user && authData.session) {
      console.log('✅ Supabase Auth successful');
      
      // Check if user is a super user
      const { data: superUser } = await supabase
        .from('super_users')
        .select('*')
        .eq('id', authData.user.id)
        .eq('active', true)
        .single();

      if (superUser) {
        const authUser: AuthUser = {
          id: superUser.id,
          email: superUser.email,
          user_type: 'super_user',
          super_user_profile: superUser
        };
        
        await setUserContext(authUser.email);
        return { data: { user: authUser } };
      }

      // Check if user is organization member
      const { data: member } = await supabase
        .from('organization_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('id', authData.user.id)
        .eq('active', true)
        .single();

      if (member) {
        // Check if member is approved
        if (!member.approved) {
          // Sign out the user since they're not approved yet
          await supabase.auth.signOut();
          return { error: 'Medlemskapet ditt venter på godkjenning fra en administrator' };
        }
        
        const authUser: AuthUser = {
          id: member.id,
          email: member.email,
          user_type: 'organization_member',
          organization_id: member.organization_id,
          member_profile: member,
          organization: member.organizations
        };
        
        await setUserContext(authUser.email);
        return { data: { user: authUser } };
      }
      
      // User exists in auth but not in our tables - sign them out
      await supabase.auth.signOut();
      return { error: 'Bruker ikke funnet i systemet' };
    }

    // If Supabase auth fails, return error
    console.log('❌ Supabase Auth failed');
    return { error: 'Ugyldig e-post eller passord' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Innlogging feilet' };
  }
}


export async function registerOrganizationMember(
  organizationSlug: string,
  email: string,
  password: string,
  fullName: string,
  memberNumber?: string
): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    console.log('📝 Registering member for organization:', organizationSlug);
    
    // Get organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', organizationSlug)
      .eq('active', true)
      .single();

    if (orgError || !organization) {
      console.error('❌ Organization not found:', organizationSlug);
      return { error: 'Organisasjon ikke funnet' };
    }

    console.log('✅ Organization found:', organization.name);
    
    // Check if email already exists in this organization
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organization.id)
      .eq('email', email)
      .single();

    if (existingMember) {
      console.error('❌ Email already exists');
      return { error: 'E-post er allerede registrert i denne organisasjonen' };
    }

    console.log('📝 Creating Supabase Auth user...');
    
    // Create user in Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          member_number: memberNumber,
          organization_id: organization.id,
          role: 'member'
        }
      }
    });

    if (authError) {
      console.error('❌ Supabase Auth signup failed:', authError);
      return { error: authError.message };
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return { error: 'Kunne ikke opprette bruker' };
    }

    console.log('✅ Supabase Auth user created:', authData.user.id);
    
    // Hash password for storage in organization_members table
    const bcryptLib = await import('bcryptjs');
    const memberPasswordHash = await bcryptLib.hash(password, 10);
    
    try {
      console.log('📝 Creating organization member record...');
      
      // Create member record using the auth user ID
      const { data: newMember, error: memberError } = await supabase
        .from('organization_members')
        .insert({
          id: authData.user.id, // Use auth user ID as primary key
          organization_id: organization.id,
          email,
          full_name: fullName,
          member_number: memberNumber,
          password_hash: passwordHash,
          role: 'member',
          approved: false,
          active: true
        })
        .select()
        .single();

      if (memberError) {
        console.error('❌ Failed to create member record:', memberError);
        
        // Rollback: Delete the auth user if member creation failed
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🔄 Rolled back auth user creation');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback auth user:', rollbackError);
        }
        
        return { error: 'Kunne ikke registrere medlem' };
      }

      console.log('✅ Member record created successfully');
      
      // Send welcome email (member needs approval)
      try {
        const { sendMemberWelcomeEmail } = await import('./emailService');
        await sendMemberWelcomeEmail(
          email,
          fullName,
          organization.name,
          organization.id,
          memberNumber
        );
        console.log('📧 Welcome email sent');
      } catch (emailError) {
        console.warn('⚠️ Welcome email failed:', emailError);
      }
      
      const authUser: AuthUser = {
        id: newMember.id,
        email: newMember.email,
        user_type: 'organization_member',
        organization_id: organization.id,
        member_profile: newMember,
        organization
      };

      return { data: { user: authUser } };
      
    } catch (error) {
      console.error('❌ Error creating member record:', error);
      
      // Rollback: Delete the auth user if member creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('🔄 Rolled back auth user creation');
      } catch (rollbackError) {
        console.error('❌ Failed to rollback auth user:', rollbackError);
      }
      
      return { error: 'Kunne ikke registrere medlem' };
    }

  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Registrering feilet' };
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    // Check if user is super user using auth user ID
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

    // Check if user is organization member using auth user ID
    const { data: member } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations (*)
      `)
      .eq('id', user.id)
      .eq('active', true)
      .single();

    if (member) {
      // Check if member is approved
      if (!member.approved) {
        // Sign out unapproved users
        await supabase.auth.signOut();
        return null;
      }
      
      return {
        id: member.id,
        email: member.email,
        user_type: 'organization_member',
        organization_id: member.organization_id,
        member_profile: member,
        organization: member.organizations
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

// Organization functions
export async function getOrganizationBySlug(slug: string): Promise<ApiResponse<Organization>> {
  try {
    console.log('🔍 Querying organization by slug:', slug);
    
    // Return fallback immediately for demo
    if (slug === 'svpk') {
      const fallbackOrg: Organization = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Svolvær Pistolklubb',
        slug: 'svpk',
        description: 'Norges beste pistolklubb',
        website: 'https://svpk.no',
        email: 'post@svpk.no',
        phone: '+47 123 45 678',
        address: 'Svolværgata 1, 8300 Svolvær',
        logo_url: null,
        primary_color: '#FFD700',
        secondary_color: '#1F2937',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        active: true
      };
      console.log('✅ Using fallback SVPK organization');
      return { data: fallbackOrg };
    }
    
    // For other organizations, try database with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('active', true)
        .abortSignal(controller.signal)
        .single();
      
      clearTimeout(timeoutId);

      if (error) {
        console.log('❌ Supabase query error:', error.message || error.code);
        
        // If it's a "not found" error, return specific message
        if (error.code === 'PGRST116') {
          return { error: 'Organisasjon ikke funnet' };
        }
        
        return { error: 'Organisasjon ikke funnet' };
      }

      console.log('✅ Organization found:', data.name);
      return { data };
    } catch (dbError) {
      console.log('⚠️ Database error, organization not found');
      if (dbError instanceof Error && dbError.name === 'AbortError') {
        return { error: 'Database connection timeout' };
      }
      return { error: 'Organisasjon ikke funnet' };
    }

  } catch (error) {
    console.error('Error getting organization:', error);
    
    // Handle different error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { error: 'Database connection timeout' };
      }
      if (error.message.includes('timeout')) {
        return { error: 'Database connection timeout' };
      }
    }
    
    return { error: 'Kunne ikke hente organisasjon' };
  }
}

export async function createOrganization(orgData: Partial<Organization>): Promise<ApiResponse<Organization>> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: orgData.name,
        slug: orgData.slug,
        description: orgData.description,
        website: orgData.website,
        email: orgData.email,
        phone: orgData.phone,
        address: orgData.address,
        primary_color: orgData.primary_color || '#FFD700',
        secondary_color: orgData.secondary_color || '#1F2937',
        active: true
      })
      .select()
      .single();

    if (error) {
      return { error: 'Kunne ikke opprette organisasjon' };
    }

    return { data };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { error: 'Kunne ikke opprette organisasjon' };
  }
}

export async function getOrganizationBranding(organizationId: string): Promise<OrganizationBranding> {
  try {
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, primary_color, secondary_color, logo_url')
      .eq('id', organizationId)
      .single();

    if (organization) {
      return {
        organization_name: organization.name,
        primary_color: organization.primary_color || '#FFD700',
        secondary_color: organization.secondary_color || '#1F2937',
        logo_url: organization.logo_url
      };
    }

    // Default branding
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

// Super user functions
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

export async function createFirstSuperUser(email: string, password: string, fullName: string): Promise<ApiResponse<SuperUser>> {
  try {
    console.log('🔧 Creating Supabase Auth user for super user...');
    
    // Create Supabase auth user first
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
      console.error('❌ Supabase Auth signup failed:', authError);
      return { error: authError.message };
    }

    if (!authData.user) {
      console.error('❌ No user returned from signup');
      return { error: 'Kunne ikke opprette bruker' };
    }

    console.log('✅ Supabase Auth user created:', authData.user.id);
    
    // Hash password for storage in super_users table
    const bcryptLib = await import('bcryptjs');
    const superUserPasswordHash = await bcryptLib.hash(password, 10);
    
    // Create super user record using the auth user ID
    const { data, error } = await supabase
      .from('super_users')
      .insert({
        id: authData.user.id, // Use auth user ID as primary key
        email,
        full_name: fullName,
        password_hash: superUserPasswordHash,
        active: true
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create super user record:', error);
      
      // Rollback: Delete the auth user if super user creation failed
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
        console.log('🔄 Rolled back auth user creation');
      } catch (rollbackError) {
        console.error('❌ Failed to rollback auth user:', rollbackError);
      }
      
      return { error: 'Kunne ikke opprette super-bruker' };
    }

    console.log('✅ Super user record created successfully');
    return { data };
  } catch (error) {
    console.error('Error creating first super user:', error);
    return { error: 'Kunne ikke opprette super-bruker' };
  }
}

// Organization member functions
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
    console.error('Error getting organization members:', error);
    return { error: 'Kunne ikke hente medlemmer' };
  }
}

export async function addOrganizationMember(
  organizationId: string,
  memberData: Partial<OrganizationMember> & { password?: string }
): Promise<ApiResponse<OrganizationMember>> {
  try {
    let authUserId: string;
    
    // If password is provided, create Supabase Auth user
    if (memberData.password) {
      console.log('📝 Creating Supabase Auth user for new member...');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email!,
        password: memberData.password,
        options: {
          data: {
            full_name: memberData.full_name,
            member_number: memberData.member_number,
            organization_id: organizationId,
            role: memberData.role || 'member'
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase Auth signup failed:', authError);
        return { error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user returned from signup');
        return { error: 'Kunne ikke opprette bruker' };
      }

      authUserId = authData.user.id;
      console.log('✅ Supabase Auth user created:', authUserId);
    } else {
      // Generate a UUID for members created without auth (admin-created)
      authUserId = crypto.randomUUID();
    }
    
    // Hash password if provided
    let passwordHash: string | undefined;
    if (memberData.password) {
      const bcryptLib = await import('bcryptjs');
      passwordHash = await bcryptLib.hash(memberData.password, 10);
    }
    
    const { data, error } = await supabase
      .from('organization_members')
      .insert({
        id: authUserId, // Use auth user ID or generated UUID
        organization_id: organizationId,
        email: memberData.email,
        full_name: memberData.full_name,
        member_number: memberData.member_number,
        password_hash: passwordHash || 'placeholder_hash', // Required by schema
        role: memberData.role || 'member',
        approved: memberData.approved || false,
        active: memberData.active !== false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create member record:', error);
      
      // Rollback auth user if it was created
      if (memberData.password && authUserId) {
        try {
          await supabase.auth.admin.deleteUser(authUserId);
          console.log('🔄 Rolled back auth user creation');
        } catch (rollbackError) {
          console.error('❌ Failed to rollback auth user:', rollbackError);
        }
      }
      
      return { error: 'Kunne ikke legge til medlem' };
    }

    console.log('✅ Member record created successfully');
    return { data };
  } catch (error) {
    console.error('Error adding organization member:', error);
    return { error: 'Kunne ikke legge til medlem' };
  }
}

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
      return { error: 'Kunne ikke oppdatere medlem' };
    }

    return { data };
  } catch (error) {
    console.error('Error updating organization member:', error);
    return { error: 'Kunne ikke oppdatere medlem' };
  }
}

export async function deleteOrganizationMember(memberId: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return { error: 'Kunne ikke slette medlem' };
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error deleting organization member:', error);
    return { error: 'Kunne ikke slette medlem' };
  }
}

export async function approveMember(memberId: string): Promise<ApiResponse<OrganizationMember>> {
  try {
    console.log('✅ Approving member:', memberId);
    
    // Update member approval status
    const result = await updateOrganizationMember(memberId, { approved: true });
    
    if (result.error) {
      return result;
    }
    
    // If member has an auth user, ensure they can sign in
    // (No additional action needed as Supabase Auth user already exists)
    
    return result;
  } catch (error) {
    console.error('Error approving member:', error);
    return { error: 'Kunne ikke godkjenne medlem' };
  }
}

export async function updateMemberRole(
  memberId: string,
  role: 'member' | 'admin' | 'range_officer'
): Promise<ApiResponse<OrganizationMember>> {
  return updateOrganizationMember(memberId, { role });
}

// Training location functions
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
    console.error('Error getting training locations:', error);
    return { error: 'Kunne ikke hente treningslokasjoner' };
  }
}

export async function createTrainingLocation(
  organizationId: string,
  locationData: { name: string; qr_code_id: string; description?: string }
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
      .update(updates)
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

export async function getTrainingLocationByQR(organizationId: string, qrCode: string): Promise<ApiResponse<TrainingLocation>> {
  try {
    const { data, error } = await supabase
      .from('training_locations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('qr_code_id', qrCode)
      .eq('active', true)
      .single();

    if (error) {
      return { error: `Treningslokasjon ikke funnet for QR-kode: ${qrCode}` };
    }

    return { data };
  } catch (error) {
    console.error('Error getting training location by QR:', error);
    return { error: 'Kunne ikke finne treningslokasjon' };
  }
}

// Training session functions
export async function startTrainingSession(
  organizationId: string,
  memberId: string,
  locationId: string
): Promise<ApiResponse<MemberTrainingSession>> {
  try {
    // Check for existing session today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingSession } = await supabase
      .from('member_training_sessions')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('member_id', memberId)
      .gte('start_time', `${today}T00:00:00`)
      .lt('start_time', `${today}T23:59:59`)
      .single();

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
      .select(`
        *,
        organization_members (*),
        training_locations (*)
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

export async function getMemberTrainingSessions(memberId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .select(`
        *,
        organization_members (*),
        training_locations (*),
        training_session_details (*),
        session_target_images (*)
      `)
      .eq('member_id', memberId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: 'Kunne ikke hente treningsøkter' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting member training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

export async function getOrganizationTrainingSessions(organizationId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const { data, error } = await supabase
      .from('member_training_sessions')
      .select(`
        *,
        organization_members (*),
        training_locations (*),
        training_session_details (*),
        session_target_images (*)
      `)
      .eq('organization_id', organizationId)
      .order('start_time', { ascending: false });

    if (error) {
      return { error: 'Kunne ikke hente treningsøkter' };
    }

    return { data: data || [] };
  } catch (error) {
    console.error('Error getting organization training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

export async function verifyTrainingSession(sessionId: string, verifiedBy: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('member_training_sessions')
      .update({
        verified: true,
        verified_by: verifiedBy,
        verification_time: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      return { error: 'Kunne ikke verifisere treningsøkt' };
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error verifying training session:', error);
    return { error: 'Kunne ikke verifisere treningsøkt' };
  }
}

export async function addManualTrainingSession(
  organizationId: string,
  memberId: string,
  locationId: string,
  sessionData: { date: string; activity: string; notes?: string },
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
      .select(`
        *,
        organization_members (*),
        training_locations (*)
      `)
      .single();

    if (error) {
      return { error: 'Kunne ikke legge til manuell treningsøkt' };
    }

    // Add training details if activity is specified
    if (sessionData.activity && sessionData.activity !== 'Trening') {
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

export async function updateTrainingDetails(
  sessionId: string,
  details: Partial<TrainingSessionDetails>
): Promise<ApiResponse<void>> {
  try {
    // Check if details already exist
    const { data: existingDetails } = await supabase
      .from('training_session_details')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existingDetails) {
      // Update existing
      const { error } = await supabase
        .from('training_session_details')
        .update(details)
        .eq('session_id', sessionId);

      if (error) {
        return { error: 'Kunne ikke oppdatere treningsdetaljer' };
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
        return { error: 'Kunne ikke opprette treningsdetaljer' };
      }
    }

    return { data: undefined };
  } catch (error) {
    console.error('Error updating training details:', error);
    return { error: 'Kunne ikke oppdatere treningsdetaljer' };
  }
}

// File upload functions
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(filePath, file);

    if (error) {
      throw new Error('Kunne ikke laste opp profilbilde');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Kunne ikke laste opp profilbilde');
  }
}

export async function uploadStartkortPDF(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `startkort-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      throw new Error('Kunne ikke laste opp startkort');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading startkort PDF:', error);
    throw new Error('Kunne ikke laste opp startkort');
  }
}

export async function uploadDiplomaPDF(file: File, userId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `diploma-${userId}-${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      throw new Error('Kunne ikke laste opp diplom');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading diploma PDF:', error);
    throw new Error('Kunne ikke laste opp diplom');
  }
}

export async function uploadTargetImage(file: File, sessionId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `target-${sessionId}-${Date.now()}.${fileExt}`;
    const filePath = `target-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('target-images')
      .upload(filePath, file);

    if (error) {
      throw new Error('Kunne ikke laste opp målbilde');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('target-images')
      .getPublicUrl(filePath);

    // Save to session_target_images table
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
    throw new Error('Kunne ikke laste opp målbilde');
  }
}

export async function updateOrganizationLogo(organizationId: string, file: File): Promise<ApiResponse<string>> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${organizationId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await supabase.storage
      .from('logos')
      .upload(filePath, file);

    if (error) {
      throw new Error('Kunne ikke laste opp logo');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    // Update organization with new logo URL
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', organizationId);

    if (updateError) {
      throw new Error('Kunne ikke oppdatere organisasjon med ny logo');
    }

    return { data: publicUrl };
  } catch (error) {
    console.error('Error updating organization logo:', error);
    return { error: 'Kunne ikke oppdatere logo' };
  }
}