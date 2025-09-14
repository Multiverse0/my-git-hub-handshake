import { useState, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, XCircle, CheckCircle, AlertCircle, Edit2, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getOrganizationMembers, approveMember, updateMemberRole, updateOrganizationMember, deleteOrganizationMember } from '../lib/supabase';
import { sendMemberApprovalEmail, generateLoginUrl } from '../lib/emailService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { nullToEmptyString, nullToUndefined, nullToFalse } from '../lib/typeUtils';
import { canManageMembers } from '../lib/authHelpers';
import type { OrganizationMember } from '../lib/types';

interface MemberManagementProps {
  onMemberCountChange?: (count: number) => void;
}

interface EditModalProps {
  member: OrganizationMember;
  onClose: () => void;
  onSave: (updatedMember: OrganizationMember) => void;
}

function EditModal({ member, onClose, onSave }: EditModalProps) {
  const [editedMember, setEditedMember] = useState({ ...member });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedMember);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Rediger Medlem</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Navn
              </label>
              <input
                type="text"
                value={editedMember.full_name}
                onChange={(e) => setEditedMember(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-post
              </label>
              <input
                type="email"
                value={editedMember.email}
                onChange={(e) => setEditedMember(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SkytterID
              </label>
              <input
                type="text"
                value={editedMember.member_number}
                onChange={(e) => setEditedMember(prev => ({ ...prev, member_number: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={editedMember.role}
                onChange={(e) => setEditedMember(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' | 'range_officer' }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="member">Medlem</option>
                <option value="admin">Administrator</option>
                <option value="range_officer">Baneansvarlig</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Lagre endringer
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function MemberManagement({ onMemberCountChange }: MemberManagementProps) {
  const { user, organization } = useAuth();
  const { t } = useLanguage();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'full_name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Check if current user can manage admin roles - only admins and super users
  const canManageAdmins = canManageMembers(user);

  // Load members from database
  useEffect(() => {
    if (!organization?.id) return;
    
    const loadMembers = async () => {
      try {
        const result = await getOrganizationMembers(organization.id);
        if (result.error) {
          throw new Error(result.error);
        }
        
        setMembers(result.data || []);
        
        // Update member count for parent component
        if (onMemberCountChange && result.data) {
          const pendingCount = result.data.filter(member => !member.approved).length;
          onMemberCountChange(pendingCount);
        }
      } catch (error) {
        console.error('Error loading members:', error);
        setError('Kunne ikke laste medlemmer');
        setMembers([]);
      }
    };

    loadMembers();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadMembers, 30000);
    
    return () => clearInterval(interval);
  }, [organization?.id, onMemberCountChange]);

  const handleSort = (field: 'created_at' | 'full_name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleApprove = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    try {
      setError(null);
      const result = await approveMember(memberId);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, approved: true } : m
      ));

      // Send approval email
      try {
        if (organization) {
          const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
          const loginUrl = generateLoginUrl(organization.slug);
          const adminName = user?.member_profile?.full_name || user?.super_user_profile?.full_name || 'Administrator';
          
          const emailResult = await sendMemberApprovalEmail(
            member.email,
            member.full_name,
            organization.name,
            organization.id,
            tempPassword,
            loginUrl,
            adminName
          );
          
          if (!emailResult.success) {
            console.warn('Approval email failed:', emailResult.error);
            setError(`Medlem godkjent, men e-post kunne ikke sendes: ${emailResult.error}`);
            setTimeout(() => setError(null), 5000);
          }
        }
      } catch (emailError) {
        console.warn('Email service error:', emailError);
      }
    } catch (error) {
      console.error('Error approving member:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke godkjenne medlem');
    }
  };

  const pendingMembers = members.filter(member => !member.approved);

  const handleApproveAll = async () => {
    if (pendingMembers.length === 0) return;
    
    if (window.confirm(`Er du sikker på at du vil godkjenne alle ${pendingMembers.length} ventende medlemmer?`)) {
      try {
        setError(null);
        
        // Approve all pending members in database
        const approvalPromises = pendingMembers.map(member => approveMember(member.id));
        const results = await Promise.all(approvalPromises);
        
        // Check for errors
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          throw new Error(`Kunne ikke godkjenne ${errors.length} medlemmer`);
        }
        
        // Update local state
        setMembers(prev => prev.map(m =>
          !m.approved ? { ...m, approved: true } : m
        ));
        
      } catch (error) {
        console.error('Error approving all members:', error);
        setError(error instanceof Error ? error.message : 'Kunne ikke godkjenne alle medlemmer');
      }
    }
  };

  const handleUnapprove = async (memberId: string) => {
    if (window.confirm('Er du sikker på at du vil fjerne godkjenningen av dette medlemmet?')) {
      try {
        setError(null);
        const result = await updateOrganizationMember(memberId, { approved: false });
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setMembers(prev => prev.map(member =>
          member.id === memberId ? { ...member, approved: false } : member
        ));
      } catch (error) {
        console.error('Error unapproving member:', error);
        setError('Kunne ikke fjerne godkjenning');
      }
    }
  };

  const handleSaveEdit = async (updatedMember: OrganizationMember) => {
    try {
      setError(null);
      const result = await updateOrganizationMember(updatedMember.id, updatedMember);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setMembers(prev => prev.map(member =>
        member.id === updatedMember.id ? result.data! : member
      ));
      setEditingMember(null);
    } catch (error) {
      console.error('Error updating member:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke oppdatere medlem');
    }
  };

  const handleToggleAdmin = async (memberId: string) => {
    if (!canManageAdmins) return;
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const action = newRole === 'admin' ? 'gi admin-rettigheter til' : 'fjerne admin-rettigheter fra';
    
    if (window.confirm(`Er du sikker på at du vil ${action} ${member.full_name}?`)) {
      try {
        setError(null);
        const result = await updateMemberRole(memberId, newRole);
        if (result.error) {
          throw new Error(result.error);
        }
        
        setMembers(prev => prev.map(m =>
          m.id === memberId ? { ...m, role: newRole } : m
        ));
      } catch (error) {
        console.error('Error updating member role:', error);
        setError('Kunne ikke oppdatere medlemsrolle');
      }
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!canManageAdmins) return;
    
    if (window.confirm(`Er du sikker på at du vil slette medlemmet "${memberName}" permanent? Denne handlingen kan ikke angres.`)) {
      try {
        setError(null);
        const result = await deleteOrganizationMember(memberId);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setMembers(prev => prev.filter(member => member.id !== memberId));
      } catch (error) {
        console.error('Error deleting member:', error);
        setError('Kunne ikke slette medlem');
      }
    }
  };

  // Filter and sort members
  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.member_number && member.member_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortField === 'created_at') {
      const aDate = new Date(a.created_at || 0);
      const bDate = new Date(b.created_at || 0);
      return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
    } else {
      const aName = a.full_name?.toLowerCase() || '';
      const bName = b.full_name?.toLowerCase() || '';
      if (sortDirection === 'asc') {
        return aName.localeCompare(bName);
      } else {
        return bName.localeCompare(aName);
      }
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-svpk-yellow mb-2">
            {t('admin.member_management')}
          </h2>
          <p className="text-gray-400">
            {t('admin.description')}
          </p>
        </div>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.search_members')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {pendingMembers.length > 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-yellow-400">Ventende godkjenninger</h3>
                <p className="text-sm text-yellow-200">
                  {pendingMembers.length} medlem{pendingMembers.length === 1 ? '' : 'mer'} venter på godkjenning
                </p>
              </div>
              <button
                onClick={handleApproveAll}
                className="btn-primary text-sm"
              >
                Godkjenn alle
              </button>
            </div>
          </div>
        )}

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-700 text-sm font-medium text-gray-300">
          <div className="col-span-3 flex items-center gap-2">
            <button
              onClick={() => handleSort('full_name')}
              className="flex items-center gap-1 hover:text-white"
            >
              Navn
              {sortField === 'full_name' && (
                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="col-span-3">E-post</div>
          <div className="col-span-2">SkytterID</div>
          <div className="col-span-1">Rolle</div>
          <div className="col-span-2 flex items-center gap-2">
            <button
              onClick={() => handleSort('created_at')}
              className="flex items-center gap-1 hover:text-white"
            >
              Registrert
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="col-span-1">Handlinger</div>
        </div>

        {/* Member List */}
        <div className="space-y-2">
          {paginatedMembers.map((member) => (
            <div
              key={member.id}
              className={`grid grid-cols-12 gap-4 p-3 rounded-lg ${
                member.approved ? 'bg-gray-700/50' : 'bg-yellow-900/20 border border-yellow-700'
              }`}
            >
              <div className="col-span-3 flex items-center gap-2">
                <span className="font-medium">{member.full_name}</span>
                {!member.approved && <span className="text-yellow-400 text-xs">(Venter)</span>}
              </div>
              <div className="col-span-3 text-gray-300">{member.email}</div>
              <div className="col-span-2 text-gray-300">{member.member_number || 'N/A'}</div>
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded text-xs ${
                  member.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                  member.role === 'range_officer' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {member.role === 'admin' ? 'Admin' :
                   member.role === 'range_officer' ? 'Baneansv.' : 'Medlem'}
                </span>
              </div>
              <div className="col-span-2 text-sm text-gray-400">
                {member.created_at ? format(new Date(member.created_at), 'dd.MM.yyyy') : 'N/A'}
              </div>
              <div className="col-span-1 flex items-center gap-1">
                {!member.approved ? (
                  <button
                    onClick={() => handleApprove(member.id)}
                    className="p-1 text-green-400 hover:text-green-300"
                    title="Godkjenn medlem"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleUnapprove(member.id)}
                      className="p-1 text-yellow-400 hover:text-yellow-300"
                      title="Fjern godkjenning"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-1 text-blue-400 hover:text-blue-300"
                      title="Rediger medlem"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {canManageAdmins && (
                      <>
                        <button
                          onClick={() => handleToggleAdmin(member.id)}
                          className={`p-1 ${
                            member.role === 'admin' 
                              ? 'text-purple-400 hover:text-purple-300' 
                              : 'text-gray-400 hover:text-gray-300'
                          }`}
                          title={member.role === 'admin' ? 'Fjern admin' : 'Gi admin-rettigheter'}
                        >
                          {member.role === 'admin' ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id, member.full_name)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Slett medlem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4 border-t border-gray-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Forrige
            </button>
            <span className="text-sm text-gray-400">
              Side {currentPage} av {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
            >
              Neste
            </button>
          </div>
        )}
      </div>

      {editingMember && (
        <EditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}