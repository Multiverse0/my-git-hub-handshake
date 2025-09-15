// Authentication helper functions for AKTIVLOGG
import type { AuthUser } from './types';

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  
  return user.user_type === 'super_user' || 
         (user.user_type === 'organization_member' &&
          (user.member_profile?.role === 'admin' || user.member_profile?.role === 'range_officer'));
}

/**
 * Check if user is a super user
 */
export function isSuperUser(user: AuthUser | null): boolean {
  return user?.user_type === 'super_user';
}

/**
 * Check if user is an organization member
 */
export function isOrganizationMember(user: AuthUser | null): boolean {
  return user?.user_type === 'organization_member';
}

/**
 * Check if user can manage members
 */
export function canManageMembers(user: AuthUser | null): boolean {
  if (!user) return false;
  
  return user.user_type === 'super_user' || 
         (user.user_type === 'organization_member' && user.member_profile?.role === 'admin');
}

/**
 * Check if user can verify training sessions
 */
export function canVerifyTraining(user: AuthUser | null): boolean {
  if (!user) return false;
  
  return user.user_type === 'super_user' || 
         (user.user_type === 'organization_member' &&
          (user.member_profile?.role === 'admin' || user.member_profile?.role === 'range_officer'));
}

/**
 * Check if user can access organization settings
 */
export function canManageOrganization(user: AuthUser | null): boolean {
  if (!user) return false;
  
  return user.user_type === 'super_user' || 
         (user.user_type === 'organization_member' && user.member_profile?.role === 'admin');
}

/**
 * Get user display name
 */
export function getUserDisplayName(user: AuthUser | null): string {
  if (!user) return 'Ukjent bruker';
  
  if (user.super_user_profile) {
    return user.super_user_profile.full_name;
  }
  
  if (user.member_profile) {
    return user.member_profile.full_name;
  }
  
  return user.email;
}

/**
 * Get user role display text
 */
export function getUserRoleText(user: AuthUser | null): string {
  if (!user) return 'Ingen rolle';
  
  if (user.user_type === 'super_user') {
    return 'Super Administrator';
  }
  
  if (user.member_profile) {
    switch (user.member_profile.role) {
      case 'admin':
        return 'Administrator';
      case 'range_officer':
        return 'Standplassleder';
      case 'member':
        return 'Medlem';
      default:
        return 'Medlem';
    }
  }
  
  return 'Ukjent rolle';
}

/**
 * Check if user needs approval
 */
export function needsApproval(user: AuthUser | null): boolean {
  if (!user) return false;
  
  return user.user_type === 'organization_member' && 
         !user.member_profile?.approved;
}

/**
 * Get organization access level for user
 */
export function getOrganizationAccess(user: AuthUser | null, organizationId: string): 'none' | 'member' | 'admin' | 'super' {
  if (!user) return 'none';
  
  if (user.user_type === 'super_user') {
    return 'super';
  }
  
  if (user.user_type === 'organization_member' && user.organization_id === organizationId) {
    if (user.member_profile?.role === 'admin') {
      return 'admin';
    }
    return 'member';
  }
  
  return 'none';
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Passordet må være minst 8 tegn langt' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Passordet må inneholde minst én stor bokstav' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Passordet må inneholde minst én liten bokstav' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Passordet må inneholde minst ett tall' };
  }
  
  return { valid: true };
}

/**
 * Generate secure password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Format user for display in admin interfaces
 */
export function formatUserForDisplay(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: getUserDisplayName(user),
    role: getUserRoleText(user),
    type: user.user_type,
    needsApproval: needsApproval(user),
    organizationId: user.organization_id,
    organizationName: user.organization?.name
  };
}