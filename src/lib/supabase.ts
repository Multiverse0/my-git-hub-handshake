import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import type { 
  Organization, 
  OrganizationMember, 
  AuthUser, 
  OrganizationBranding, 
  TrainingLocation,
  MemberTrainingSession,
  TrainingSessionDetails,
  ApiResponse 
} from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication functions
export async function authenticateUser(email: string, password: string): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    // For demo purposes, use localStorage authentication
    const savedMembers = localStorage.getItem('members');
    const savedSuperUsers = localStorage.getItem('superUsers');
    
    // Check super users first
    if (savedSuperUsers) {
      const superUsers = JSON.parse(savedSuperUsers);
      const superUser = superUsers.find((user: any) => user.email === email && user.active);
      
      if (superUser) {
        // Verify password
        const isValidPassword = await bcrypt.compare(password, superUser.password_hash);
        if (isValidPassword) {
          const authUser: AuthUser = {
            id: superUser.id,
            email: superUser.email,
            user_type: 'super_user',
            super_user_profile: superUser
          };
          
          // Save current user to localStorage
          localStorage.setItem('currentUser', JSON.stringify({ user: authUser }));
          
          return { data: { user: authUser } };
        }
      }
    }
    
    // Check organization members
    if (savedMembers) {
      const members = JSON.parse(savedMembers);
      const member = members.find((m: any) => m.email === email && m.approved && m.active);
      
      if (member) {
        // For demo, accept any password for approved members
        const authUser: AuthUser = {
          id: member.id,
          email: member.email,
          user_type: 'organization_member',
          organization_id: member.organization_id,
          member_profile: member
        };
        
        // Load organization data
        const savedOrgs = localStorage.getItem('organizations');
        if (savedOrgs) {
          const organizations = JSON.parse(savedOrgs);
          const organization = organizations.find((org: any) => org.id === member.organization_id);
          if (organization) {
            authUser.organization = organization;
          }
        }
        
        localStorage.setItem('currentUser', JSON.stringify({ user: authUser }));
        
        return { data: { user: authUser } };
      }
    }
    
    // Demo mode: Allow any email/password combination for admin access
    const demoUser: AuthUser = {
      id: 'demo-admin',
      email: email,
      user_type: 'organization_member',
      organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      member_profile: {
        id: 'demo-admin',
        organization_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: email,
        full_name: 'Demo Administrator',
        member_number: '99999',
        role: 'admin',
        approved: true,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      organization: {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      }
    };
    
    localStorage.setItem('currentUser', JSON.stringify({ user: demoUser }));
    
    return { data: { user: demoUser } };
    
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
    // Get organization by slug
    const orgResult = await getOrganizationBySlug(organizationSlug);
    if (orgResult.error || !orgResult.data) {
      throw new Error('Organisasjon ikke funnet');
    }
    
    const organization = orgResult.data;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new member
    const newMember = {
      id: crypto.randomUUID(),
      organization_id: organization.id,
      email,
      full_name: fullName,
      member_number: memberNumber,
      password_hash: passwordHash,
      role: 'member' as const,
      approved: false,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const savedMembers = localStorage.getItem('members');
    const members = savedMembers ? JSON.parse(savedMembers) : [];
    
    // Check for duplicate email
    if (members.some((member: any) => member.email === email && member.organization_id === organization.id)) {
      throw new Error('E-post er allerede registrert i denne organisasjonen');
    }
    
    members.push(newMember);
    localStorage.setItem('members', JSON.stringify(members));
    
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
    console.error('Registration error:', error);
    return { error: error instanceof Error ? error.message : 'Registrering feilet' };
  }
}

export async function getOrganizationBySlug(slug: string): Promise<ApiResponse<Organization>> {
  try {
    // Load from localStorage for demo
    const savedOrgs = localStorage.getItem('organizations');
    if (savedOrgs) {
      const organizations = JSON.parse(savedOrgs);
      const organization = organizations.find((org: any) => org.slug === slug);
      if (organization) {
        return { data: organization };
      }
    }
    
    // Default SVPK organization for demo
    if (slug === 'svpk') {
      const defaultOrg: Organization = {
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active: true
      };
      
      return { data: defaultOrg };
    }
    
    return { error: 'Organisasjon ikke funnet' };
  } catch (error) {
    console.error('Error getting organization:', error);
    return { error: 'Kunne ikke hente organisasjon' };
  }
}

export async function setUserContext(email: string): Promise<void> {
  // For demo purposes, this is a no-op
  console.log('Setting user context for:', email);
}

export async function getOrganizationBranding(organizationId: string): Promise<OrganizationBranding> {
  try {
    const savedOrgs = localStorage.getItem('organizations');
    if (savedOrgs) {
      const organizations = JSON.parse(savedOrgs);
      const organization = organizations.find((org: any) => org.id === organizationId);
      if (organization) {
        return {
          organization_name: organization.name,
          primary_color: organization.primary_color || '#FFD700',
          secondary_color: organization.secondary_color || '#1F2937',
          background_color: organization.background_color || '#111827',
          logo_url: organization.logo_url
        };
      }
    }
    
    // Default branding
    return {
      organization_name: 'Svolvær Pistolklubb',
      primary_color: '#FFD700',
      secondary_color: '#1F2937',
      background_color: '#111827'
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

export async function checkSuperUsersExist(): Promise<boolean> {
  try {
    const savedSuperUsers = localStorage.getItem('superUsers');
    if (savedSuperUsers) {
      const superUsers = JSON.parse(savedSuperUsers);
      return superUsers.some((user: any) => user.active);
    }
    return false;
  } catch (error) {
    console.error('Error checking super users:', error);
    return false;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      return userData.user;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    localStorage.removeItem('currentUser');
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

export async function createFirstSuperUser(email: string, password: string, fullName: string): Promise<ApiResponse<any>> {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const newSuperUser = {
      id: crypto.randomUUID(),
      email,
      full_name: fullName,
      password_hash: passwordHash,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const superUsers = [newSuperUser];
    localStorage.setItem('superUsers', JSON.stringify(superUsers));
    
    return { data: newSuperUser };
  } catch (error) {
    console.error('Error creating first super user:', error);
    return { error: 'Kunne ikke opprette super-bruker' };
  }
}

// Organization member functions
export async function getOrganizationMembers(organizationId: string): Promise<ApiResponse<OrganizationMember[]>> {
  try {
    const savedMembers = localStorage.getItem('members');
    if (savedMembers) {
      const members = JSON.parse(savedMembers);
      const orgMembers = members.filter((member: any) => member.organization_id === organizationId);
      return { data: orgMembers };
    }
    return { data: [] };
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
    const newMember: OrganizationMember = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      email: memberData.email!,
      full_name: memberData.full_name!,
      member_number: memberData.member_number,
      role: memberData.role || 'member',
      approved: memberData.approved || false,
      active: memberData.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Hash password if provided
    if (memberData.password) {
      (newMember as any).password_hash = await bcrypt.hash(memberData.password, 10);
    }
    
    // Save to localStorage
    const savedMembers = localStorage.getItem('members');
    const members = savedMembers ? JSON.parse(savedMembers) : [];
    members.push(newMember);
    localStorage.setItem('members', JSON.stringify(members));
    
    return { data: newMember };
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
    const savedMembers = localStorage.getItem('members');
    if (savedMembers) {
      const members = JSON.parse(savedMembers);
      const memberIndex = members.findIndex((member: any) => member.id === memberId);
      
      if (memberIndex !== -1) {
        members[memberIndex] = {
          ...members[memberIndex],
          ...updates,
          updated_at: new Date().toISOString()
        };
        localStorage.setItem('members', JSON.stringify(members));
        return { data: members[memberIndex] };
      }
    }
    
    return { error: 'Medlem ikke funnet' };
  } catch (error) {
    console.error('Error updating organization member:', error);
    return { error: 'Kunne ikke oppdatere medlem' };
  }
}

export async function deleteOrganizationMember(memberId: string): Promise<ApiResponse<void>> {
  try {
    const savedMembers = localStorage.getItem('members');
    if (savedMembers) {
      const members = JSON.parse(savedMembers);
      const updatedMembers = members.filter((member: any) => member.id !== memberId);
      localStorage.setItem('members', JSON.stringify(updatedMembers));
      return { data: undefined };
    }
    
    return { error: 'Medlem ikke funnet' };
  } catch (error) {
    console.error('Error deleting organization member:', error);
    return { error: 'Kunne ikke slette medlem' };
  }
}

export async function approveMember(memberId: string): Promise<ApiResponse<OrganizationMember>> {
  return updateOrganizationMember(memberId, { approved: true });
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
    // Default locations for SVPK
    const defaultLocations: TrainingLocation[] = [
      {
        id: 'loc-1',
        organization_id: organizationId,
        name: 'Innendørs 25m',
        qr_code_id: 'svpk-innendors-25m',
        description: 'Innendørs skytebane 25 meter',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'loc-2',
        organization_id: organizationId,
        name: 'Utendørs 25m',
        qr_code_id: 'svpk-utendors-25m',
        description: 'Utendørs skytebane 25 meter',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { data: defaultLocations };
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
    const newLocation: TrainingLocation = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      name: locationData.name,
      qr_code_id: locationData.qr_code_id,
      description: locationData.description,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { data: newLocation };
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
    // For demo, return updated location
    const updatedLocation: TrainingLocation = {
      id: locationId,
      organization_id: updates.organization_id || '',
      name: updates.name || '',
      qr_code_id: updates.qr_code_id || '',
      description: updates.description,
      active: updates.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    return { data: updatedLocation };
  } catch (error) {
    console.error('Error updating training location:', error);
    return { error: 'Kunne ikke oppdatere treningslokasjon' };
  }
}

export async function getTrainingLocationByQR(organizationId: string, qrCode: string): Promise<ApiResponse<TrainingLocation>> {
  try {
    const locationsResult = await getOrganizationTrainingLocations(organizationId);
    if (locationsResult.data) {
      const location = locationsResult.data.find(loc => loc.qr_code_id === qrCode);
      if (location) {
        return { data: location };
      }
    }
    
    return { error: `Treningslokasjon ikke funnet for QR-kode: ${qrCode}` };
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
    const today = new Date().toDateString();
    const savedSessions = localStorage.getItem('trainingSessions');
    
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const existingToday = sessions.find((session: any) => 
        session.user_id === memberId && 
        new Date(session.date).toDateString() === today
      );
      
      if (existingToday) {
        return { error: 'Du har allerede registrert trening i dag' };
      }
    }
    
    // Create new training session
    const newSession = {
      id: crypto.randomUUID(),
      user_id: memberId,
      organization_id: organizationId,
      location_id: locationId,
      date: new Date().toISOString(),
      start_time: new Date().toISOString(),
      verified: false,
      approved: false,
      manual_entry: false,
      memberName: 'Medlem',
      location: 'Skytebane',
      duration: '2 timer',
      activity: 'Trening'
    };
    
    // Save to localStorage
    const sessions = savedSessions ? JSON.parse(savedSessions) : [];
    sessions.push(newSession);
    localStorage.setItem('trainingSessions', JSON.stringify(sessions));
    
    return { data: newSession as any };
  } catch (error) {
    console.error('Error starting training session:', error);
    return { error: 'Kunne ikke starte treningsøkt' };
  }
}

export async function getMemberTrainingSessions(memberId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const savedSessions = localStorage.getItem('trainingSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const memberSessions = sessions
        .filter((session: any) => session.user_id === memberId)
        .map((session: any) => ({
          id: session.id,
          organization_id: session.organization_id || '',
          member_id: memberId,
          location_id: session.location_id || '',
          start_time: session.date || session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes,
          verified: session.verified || session.approved || false,
          verified_by: session.verifiedBy || session.rangeOfficer,
          verification_time: session.verification_time,
          manual_entry: session.manual_entry || false,
          notes: session.notes,
          created_at: session.created_at || session.date,
          updated_at: session.updated_at || session.date,
          details: session.details || {
            training_type: session.training_type,
            results: session.results,
            notes: session.notes
          },
          target_images: session.target_images || []
        }));
      
      return { data: memberSessions };
    }
    
    return { data: [] };
  } catch (error) {
    console.error('Error getting member training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

export async function getOrganizationTrainingSessions(organizationId: string): Promise<ApiResponse<MemberTrainingSession[]>> {
  try {
    const savedSessions = localStorage.getItem('trainingSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const orgSessions = sessions
        .filter((session: any) => session.organization_id === organizationId)
        .map((session: any) => ({
          id: session.id,
          organization_id: organizationId,
          member_id: session.user_id || session.member_id,
          location_id: session.location_id || '',
          start_time: session.date || session.start_time,
          end_time: session.end_time,
          duration_minutes: session.duration_minutes,
          verified: session.verified || session.approved || false,
          verified_by: session.verifiedBy || session.rangeOfficer,
          verification_time: session.verification_time,
          manual_entry: session.manual_entry || false,
          notes: session.notes,
          created_at: session.created_at || session.date,
          updated_at: session.updated_at || session.date,
          member: {
            id: session.user_id || session.member_id,
            full_name: session.memberName || 'Ukjent medlem',
            member_number: session.memberNumber || '',
            email: '',
            organization_id: organizationId,
            role: 'member',
            approved: true,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          location: {
            id: session.location_id || '',
            name: session.location || session.rangeName || 'Ukjent lokasjon',
            qr_code_id: '',
            organization_id: organizationId,
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }));
      
      return { data: orgSessions };
    }
    
    return { data: [] };
  } catch (error) {
    console.error('Error getting organization training sessions:', error);
    return { error: 'Kunne ikke hente treningsøkter' };
  }
}

export async function verifyTrainingSession(sessionId: string, verifiedBy: string): Promise<ApiResponse<void>> {
  try {
    const savedSessions = localStorage.getItem('trainingSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const updatedSessions = sessions.map((session: any) =>
        session.id === sessionId ? {
          ...session,
          verified: true,
          approved: true,
          verifiedBy,
          rangeOfficer: verifiedBy,
          verification_time: new Date().toISOString()
        } : session
      );
      localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
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
    const newSession = {
      id: crypto.randomUUID(),
      user_id: memberId,
      member_id: memberId,
      organization_id: organizationId,
      location_id: locationId,
      date: sessionData.date,
      start_time: sessionData.date,
      activity: sessionData.activity,
      notes: sessionData.notes,
      verified: true,
      approved: true,
      verifiedBy,
      rangeOfficer: verifiedBy,
      manual_entry: true,
      duration: '2 timer',
      location: 'Manuell registrering',
      memberName: 'Medlem',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to localStorage
    const savedSessions = localStorage.getItem('trainingSessions');
    const sessions = savedSessions ? JSON.parse(savedSessions) : [];
    sessions.push(newSession);
    localStorage.setItem('trainingSessions', JSON.stringify(sessions));
    
    return { data: newSession as any };
  } catch (error) {
    console.error('Error adding manual training session:', error);
    return { error: 'Kunne ikke legge til manuell treningsøkt' };
  }
}

export async function updateTrainingDetails(
  sessionId: string,
  details: TrainingSessionDetails
): Promise<ApiResponse<void>> {
  try {
    const savedSessions = localStorage.getItem('trainingSessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      const updatedSessions = sessions.map((session: any) =>
        session.id === sessionId ? {
          ...session,
          details,
          training_type: details.training_type,
          results: details.results,
          notes: details.notes,
          updated_at: new Date().toISOString()
        } : session
      );
      localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
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
    // Convert to base64 for localStorage demo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        resolve(imageUrl);
      };
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Kunne ikke laste opp profilbilde');
  }
}

export async function uploadStartkortPDF(file: File, userId: string): Promise<string> {
  try {
    // Convert to base64 for localStorage demo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        resolve(fileUrl);
      };
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error uploading startkort PDF:', error);
    throw new Error('Kunne ikke laste opp startkort');
  }
}

export async function uploadDiplomaPDF(file: File, userId: string): Promise<string> {
  try {
    // Convert to base64 for localStorage demo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        resolve(fileUrl);
      };
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error uploading diploma PDF:', error);
    throw new Error('Kunne ikke laste opp diplom');
  }
}

export async function uploadTargetImage(file: File, sessionId: string): Promise<string> {
  try {
    // Convert to base64 for localStorage demo
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        resolve(imageUrl);
      };
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Error uploading target image:', error);
    throw new Error('Kunne ikke laste opp målbilde');
  }
}

export async function updateOrganizationLogo(organizationId: string, file: File): Promise<ApiResponse<string>> {
  try {
    // Convert to base64 for localStorage demo
    const logoUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        resolve(imageUrl);
      };
      reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
      reader.readAsDataURL(file);
    });
    
    // Update organization in localStorage
    const savedOrgs = localStorage.getItem('organizations');
    if (savedOrgs) {
      const organizations = JSON.parse(savedOrgs);
      const updatedOrganizations = organizations.map((org: any) =>
        org.id === organizationId ? { ...org, logo_url: logoUrl, updated_at: new Date().toISOString() } : org
      );
      localStorage.setItem('organizations', JSON.stringify(updatedOrganizations));
    }
    
    return { data: logoUrl };
  } catch (error) {
    console.error('Error updating organization logo:', error);
    return { error: 'Kunne ikke oppdatere logo' };
  }
}

export async function createOrganization(orgData: any): Promise<ApiResponse<Organization>> {
  try {
    const newOrganization: Organization = {
      id: crypto.randomUUID(),
      name: orgData.name,
      slug: orgData.slug,
      description: orgData.description,
      website: orgData.website,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      logo_url: null,
      primary_color: orgData.primary_color || '#FFD700',
      secondary_color: orgData.secondary_color || '#1F2937',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: true
    };
    
    // Save to localStorage
    const savedOrgs = localStorage.getItem('organizations');
    const organizations = savedOrgs ? JSON.parse(savedOrgs) : [];
    organizations.push(newOrganization);
    localStorage.setItem('organizations', JSON.stringify(organizations));
    
    return { data: newOrganization };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { error: 'Kunne ikke opprette organisasjon' };
  }
}