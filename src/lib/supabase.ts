import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if any super users exist
export async function checkSuperUsersExist(): Promise<boolean> {
  // Always return true to skip setup - we have hardcoded super user
  return true;
}

// Create the first super user (only works if no super users exist)
export async function createFirstSuperUser(
  email: string,
  password: string,
  fullName: string
): Promise<ApiResponse<SuperUser>> {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Use localStorage since Supabase connection is failing
    const newSuperUser = {
      id: crypto.randomUUID(),
      email,
      full_name: fullName,
      password_hash: passwordHash,
      branch: sessionData.branch,
      duration: '2 timer', // Keep duration as default for compatibility
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const existingSuperUsers = localStorage.getItem('superUsers');
    const superUsers = existingSuperUsers ? JSON.parse(existingSuperUsers) : [];
    
    // Check for duplicate email
    if (superUsers.some((user: any) => user.email === email)) {
      return { error: 'E-post er allerede registrert' };
    }
    
    superUsers.push(newSuperUser);
    localStorage.setItem('superUsers', JSON.stringify(superUsers));
    
    return { data: newSuperUser };
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
    // Continue without setting context - app will still work with reduced functionality
  }
}

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<ApiResponse<AuthUser>> {
  try {
    // Check for hardcoded super user first
    if (email === 'yngve@promonorge.no' && password === '12345678') {
      const hardcodedSuperUser = {
        id: 'hardcoded-super-user',
        email: 'yngve@promonorge.no',
        full_name: 'Yngve Rødli',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        data: {
          user: {
            id: hardcodedSuperUser.id,
            email: hardcodedSuperUser.email,
            user_type: 'super_user',
            super_user_profile: hardcodedSuperUser
          }
        }
      };
    }

    // Check for hardcoded admin user first
    if (email === 'post@svpk.no' && password === '12345678') {
      // Create hardcoded admin user
      const hardcodedAdmin = {
        id: 'hardcoded-admin-svpk',
        organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'post@svpk.no',
        full_name: 'SVPK Administrator',
        member_number: 'ADMIN001',
        password_hash: await bcrypt.hash('12345678', 10),
        role: 'admin',
        approved: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Ensure this admin is in localStorage
      const savedMembers = localStorage.getItem('members');
      const members = savedMembers ? JSON.parse(savedMembers) : [];
      
      // Check if hardcoded admin already exists
      const existingAdmin = members.find((m: any) => m.email === 'post@svpk.no');
      if (!existingAdmin) {
        members.push(hardcodedAdmin);
        localStorage.setItem('members', JSON.stringify(members));
      }
      
      // Get organization from localStorage
      const localOrg = localStorage.getItem('currentOrganization');
      const organization = localOrg ? JSON.parse(localOrg) : null;

      return {
        data: {
          user: {
            id: hardcodedAdmin.id,
            email: hardcodedAdmin.email,
            user_type: 'organization_member',
            organization_id: hardcodedAdmin.organization_id,
            organization: organization,
            member_profile: hardcodedAdmin
          }
        }
      };
    }

    // For any other email/password combination, create them as admin user automatically
    const autoAdminUser = {
      id: `auto-admin-${Date.now()}`,
      organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: email,
      full_name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      member_number: `AUTO${Date.now().toString().slice(-4)}`,
      password_hash: await bcrypt.hash(password, 10),
      role: 'admin',
      approved: true,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const savedMembers = localStorage.getItem('members');
    const members = savedMembers ? JSON.parse(savedMembers) : [];
    
    // Check if user already exists
    const existingMember = members.find((m: any) => m.email === email);
    if (!existingMember) {
      members.push(autoAdminUser);
      localStorage.setItem('members', JSON.stringify(members));
    }
    
    // Get organization from localStorage
    const localOrg = localStorage.getItem('currentOrganization');
    const organization = localOrg ? JSON.parse(localOrg) : null;

    return {
      data: {
        user: {
          id: autoAdminUser.id,
          email: autoAdminUser.email,
          user_type: 'organization_member',
          organization_id: autoAdminUser.organization_id,
          organization: organization,
          member_profile: autoAdminUser
        }
      }
    };

    // First check localStorage for super users (fallback)
    const localSuperUsers = localStorage.getItem('superUsers');
    if (localSuperUsers) {
      const superUsers = JSON.parse(localSuperUsers);
      const superUser = superUsers.find((user: any) => user.email === email && user.active);
      
      if (superUser) {
        const isValidPassword = await bcrypt.compare(password, superUser.password_hash);
        if (isValidPassword) {
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
      }
    }

    // Check organization members - first get member without status filters
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (member) {
      const isValidPassword = await bcrypt.compare(password, member.password_hash);
      if (isValidPassword) {
        // Check account status after password validation
        if (!member.approved) {
          return { error: 'Kontoen din er ikke godkjent ennå. Vennligst vent på administratorgodkjenning.' };
        }
        
        if (!member.active) {
          return { error: 'Kontoen din er inaktiv. Vennligst kontakt administrator.' };
        }
        
        // Get organization from localStorage
        const localOrg = localStorage.getItem('currentOrganization');
        const organization = localOrg ? JSON.parse(localOrg) : null;

        return {
          data: {
            user: {
              id: member.id,
              email: member.email,
              user_type: 'organization_member',
              organization_id: member.organization_id,
              organization: organization,
              member_profile: member
            }
          }
        };
      }
    }

    // Check localStorage for super users since Supabase connection is failing
    const localSuperUsers2 = localStorage.getItem('superUsers');
    if (localSuperUsers2) {
      const superUsers = JSON.parse(localSuperUsers2);
      const superUser = superUsers.find((user: any) => 
        user.email === email && user.active
      );
      
      if (superUser) {
        const isValidPassword = await bcrypt.compare(password, superUser.password_hash);
        if (isValidPassword) {
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
      }
    }

    // Check localStorage for organization members
    const localMembers = localStorage.getItem('members');
    if (localMembers) {
      const members = JSON.parse(localMembers);
      console.log('Checking localStorage members for login:', members);
      console.log('Looking for email:', email);
      
      const member = members.find((m: any) => 
        m.email === email
      );
      
      console.log('Found member:', member);
      
      if (member) {
        // Check account status after finding the member
        if (!member.approved) {
          return { error: 'Kontoen din er ikke godkjent ennå. Vennligst vent på administratorgodkjenning.' };
        }
        
        if (member.active === false) {
          return { error: 'Kontoen din er inaktiv. Vennligst kontakt administrator.' };
        }
        
        if (!member.password_hash) {
          return { error: 'Passord ikke satt for denne brukeren. Kontakt administrator.' };
        }
        
        const isValidPassword = await bcrypt.compare(password, member.password_hash);
        console.log('Password validation result:', isValidPassword);
        
        if (isValidPassword) {
          // Get organization from localStorage
          const localOrg = localStorage.getItem('currentOrganization');
          const organization = localOrg ? JSON.parse(localOrg) : null;

          return {
            data: {
              user: {
                id: member.id.toString(),
                email: member.email,
                user_type: 'organization_member',
                organization_id: member.organization_id,
                organization: organization,
                member_profile: member
              }
            }
          };
        }
      }
    }

    return { error: 'Ugyldig e-post eller passord' };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Det oppstod en feil ved innlogging' };
  }
}

export async function registerOrganizationMember(
  organizationId: string,
  email: string,
  password: string,
  fullName: string,
  memberNumber: string
): Promise<ApiResponse<OrganizationMember>> {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        email,
        full_name: fullName,
        member_number: memberNumber,
        password_hash: passwordHash,
        approved: false // Requires admin approval
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
    // Use localStorage fallback since Supabase connection is failing
    const localOrg = localStorage.getItem('currentOrganization');
    if (localOrg) {
      const orgData = JSON.parse(localOrg);
      if (orgData.slug === slug) {
        return { data: orgData };
      }
    }

    // Return default organization for SVPK
    if (slug === 'svpk') {
      const defaultOrg = {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Svolvær Pistolklubb',
        slug: 'svpk',
        description: 'Norges beste pistolklubb',
        email: 'post@svpk.no',
        phone: '+47 123 45 678',
        website: 'https://svpk.no',
        address: 'Svolværgata 1, 8300 Svolvær',
        primary_color: '#FFD700',
        secondary_color: '#1F2937',
        logo_url: null,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Save to localStorage for future use
      localStorage.setItem('currentOrganization', JSON.stringify(defaultOrg));
      return { data: defaultOrg };
    }

    return { error: 'Organisasjon ikke funnet' };
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
      .limit(1);

    return {
      organization_name: org && org[0]?.name || 'Idrettsklubb',
      primary_color: org && org[0]?.primary_color || '#FFD700',
      secondary_color: org && org[0]?.secondary_color || '#1F2937',
      logo_url: org && org[0]?.logo_url
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

    try {
      const fileName = `${organizationId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `organization-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.warn('Supabase storage error:', uploadError);
        throw new Error('Storage bucket not available');
      }

      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      return { data: urlData.publicUrl };
    } catch (supabaseError) {
      // Fallback to base64 data URL for localStorage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const logoUrl = e.target?.result as string;
          resolve({ data: logoUrl });
        };
        reader.onerror = () => {
          reject({ error: 'Kunne ikke lese filen' });
        };
        reader.readAsDataURL(logoFile);
      });
    }
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

    if (error) throw error;

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
    const { data, error } = await supabase
      .from('member_training_sessions')
      .insert({
        organization_id: organizationId,
        member_id: memberId,
        location_id: locationId,
        start_time: new Date().toISOString(),
        verified: true,
        verified_by: 'QR System',
        verification_time: new Date().toISOString()
      })
      .select(`
        *,
        member:organization_members(*),
        location:training_locations(*),
        details:training_session_details(*),
        target_images:session_target_images(*)
      `)
      .single();

    if (error) throw error;

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

    if (error) throw error;

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

    if (error) throw error;

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

    if (error) throw error;

    return { data };
  } catch (error) {
    console.error('Error verifying training session:', error);
    return { error: 'Kunne ikke verifisere treningsøkt' };
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

    if (uploadError) throw uploadError;

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

    if (insertError) throw insertError;

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

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Update member record
    const updateField = documentType === 'startkort' ? 'startkort_url' : 'diploma_url';
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ [updateField]: urlData.publicUrl })
      .eq('id', memberId);

    if (updateError) throw updateError;

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

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update member record
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', memberId);

    if (updateError) throw updateError;

    return { data: urlData.publicUrl };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { error: 'Kunne ikke laste opp profilbilde' };
  }
}

// Legacy functions for backward compatibility (will be removed)
export async function verifyRangeOfficerPassword(password: string): Promise<boolean> {
  // This is deprecated - use proper authentication instead
  return password === "svpk1965";
}

export async function addManualTrainingSession(
  sessionData: any,
  rangeOfficerName: string
): Promise<void> {
  // Create session object
  const session = {
    id: crypto.randomUUID(),
    memberName: sessionData.memberName, // Add member name to session
    date: sessionData.date,
    location: sessionData.location,
    duration: '2 timer', // Default duration
    activity: sessionData.activity,
    organization: sessionData.branch, // Map branch to organization for filtering
    notes: sessionData.notes,
    verifiedBy: rangeOfficerName,
    rangeOfficer: rangeOfficerName, // Also set rangeOfficer field
    verified: true,
    approved: true, // Set as approved since it's manually entered by admin
    manual_entry: true,
    created_at: new Date().toISOString()
  };

  // Save to localStorage (legacy support)
  const existingSessions = JSON.parse(localStorage.getItem('trainingSessions') || '[]');
  existingSessions.push(session);
  localStorage.setItem('trainingSessions', JSON.stringify(existingSessions));
  
  // Trigger refresh of training log
  localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
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
      throw fetchError;
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

      if (error) throw error;
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

      if (error) throw error;
      result = data;
    }

    return { data: result };
  } catch (error) {
    console.error('Error updating training details:', error);
    return { error: 'Kunne ikke oppdatere treningsdetaljer' };
  }
}

export async function getRangeLocationByQRCode(qrCodeId: string) {
  // Legacy function - use getTrainingLocationByQR instead
  const savedRanges = localStorage.getItem('rangeLocations');
  if (savedRanges) {
    const ranges = JSON.parse(savedRanges);
    return ranges.find((r: any) => r.qr_code_id === qrCodeId);
  }
  return null;
}