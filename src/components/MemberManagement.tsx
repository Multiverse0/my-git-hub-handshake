import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, XCircle, CheckCircle, AlertCircle, Edit2, PlusCircle, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getOrganizationMembers, approveMember, updateMemberRole } from '../lib/supabase';
import { sendMemberApprovalEmail, generateLoginUrl } from '../lib/emailService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { OrganizationMember } from '../lib/types';

interface Member {
  id: number;
  fullName: string;
  email: string;
  memberNumber: string;
  registrationDate: Date;
  approved: boolean;
  role: 'user' | 'admin';
}

interface MemberManagementProps {
  onMemberCountChange?: (count: number) => void;
}

// Dummy members for demo
const dummyMembers: Member[] = [
  {
    id: 1001,
    fullName: 'Astrid Bergström',
    email: 'astrid.bergstrom@email.no',
    memberNumber: '10001',
    registrationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    approved: false,
    role: 'user'
  },
  {
    id: 1002,
    fullName: 'Magnus Haugen',
    email: 'magnus.haugen@email.no', 
    memberNumber: '10002',
    registrationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    approved: false,
    role: 'user'
  },
  {
    id: 1003,
    fullName: 'Ingrid Svendsen',
    email: 'ingrid.svendsen@email.no',
    memberNumber: '10003', 
    registrationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    approved: true,
    role: 'user'
  },
  {
    id: 1004,
    fullName: 'Bjørn Kristoffersen',
    email: 'bjorn.kristoffersen@email.no',
    memberNumber: '10004',
    registrationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    approved: true,
    role: 'admin'
  },
  {
    id: 1005,
    fullName: 'Solveig Dahl',
    email: 'solveig.dahl@email.no',
    memberNumber: '10005',
    registrationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    approved: true,
    role: 'user'
  },
  {
    id: 1006,
    fullName: 'Torstein Lie',
    email: 'torstein.lie@email.no',
    memberNumber: '10006',
    registrationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    approved: false,
    role: 'user'
  }
];

const initialMembers: Member[] = [];

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (member: Omit<Member, 'id' | 'registrationDate' | 'approved'>) => void;
}

function AddMemberModal({ onClose, onAdd }: AddMemberModalProps) {
  const [newMember, setNewMember] = useState({
    fullName: '',
    email: '',
    memberNumber: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.fullName.trim() || !newMember.email.trim() || !newMember.memberNumber.trim()) {
      setError('Alle felt må fylles ut');
      return;
    }

    if (!newMember.email.includes('@')) {
      setError('Vennligst skriv inn en gyldig e-postadresse');
      return;
    }

    onAdd(newMember);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Legg til nytt medlem</h3>
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
                value={newMember.fullName}
                onChange={(e) => setNewMember(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="Fullt navn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-post
              </label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="navn@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SkytterID
              </label>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">
                  <a
                    href="https://app.skyting.no/user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-svpk-yellow hover:text-yellow-400"
                  >
                    (Link SkytterID)
                  </a>
                </span>
              </div>
              <input
                type="text"
                value={newMember.memberNumber}
                onChange={(e) => setNewMember(prev => ({ ...prev, memberNumber: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="12345"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

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
                Legg til
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface EditModalProps {
  member: Member;
  onClose: () => void;
  onSave: (updatedMember: Member) => void;
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
                value={editedMember.fullName}
                onChange={(e) => setEditedMember(prev => ({ ...prev, fullName: e.target.value }))}
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-400">
                  <a
                    href="https://app.skyting.no/user"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-svpk-yellow hover:text-yellow-400"
                  >
                    (Link SkytterID)
                  </a>
                </span>
              </div>
              <input
                type="text"
                value={editedMember.memberNumber}
                onChange={(e) => setEditedMember(prev => ({ ...prev, memberNumber: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={editedMember.role}
                onChange={(e) => setEditedMember(prev => ({ ...prev, role: e.target.value as 'user' | 'admin' }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="user">Bruker</option>
                <option value="admin">Administrator</option>
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'created_at' | 'full_name'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<OrganizationMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Check if current user can manage admin roles - only admins and super users
  const canManageAdmins = user?.user_type === 'super_user' || 
                          (user?.member_profile?.role === 'admin');

  // Load members from database
  React.useEffect(() => {
    if (!organization?.id) return;
    
    const loadMembers = () => {
      try {
        const result = await getOrganizationMembers(organization.id);
        if (result.error) {
          throw new Error(result.error);
        }
        
        setMembers(result.data || []);
      } catch (error) {
        console.error('Error loading members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [organization?.id]);

  // Update member count when members change
  React.useEffect(() => {
    if (onMemberCountChange) {
      const pendingCount = members.filter(member => !member.approved).length;
      onMemberCountChange(pendingCount);
    }
  }, [members]);

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
      const result = await approveMember(memberId);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update local state
      setMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, approved: true } : m
      ));

      // Try to send approval email
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      
      if (organization) {
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
          console.warn('Approval email failed (email service not configured):', emailResult.error);
          setError(`Medlem godkjent, men e-post kunne ikke sendes. Kontakt medlemmet manuelt med innloggingsopplysninger.`);
          setTimeout(() => setError(null), 5000);
        }
      }
    } catch (error) {
      console.error('Error approving member:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke godkjenne medlem');
    }
  };

  const handleApproveAll = async () => {
    if (pendingMembers.length === 0) return;
    
    if (window.confirm(`Er du sikker på at du vil godkjenne alle ${pendingMembers.length} ventende medlemmer?`)) {
      // Approve all pending members
      setMembers(prev => prev.map(m =>
        !m.approved ? { ...m, approved: true } : m
      ));
      
      // Try to send emails to all approved members
      let emailErrors = 0;
      for (const member of pendingMembers) {
        try {
          const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
          const savedOrg = localStorage.getItem('currentOrganization');
          if (savedOrg) {
            const orgData = JSON.parse(savedOrg);
            const loginUrl = generateLoginUrl(orgData.slug || 'svpk');
            const adminName = user?.member_profile?.full_name || user?.super_user_profile?.full_name || 'Administrator';
            
            const emailResult = await sendMemberApprovalEmail(
              member.email,
              member.fullName,
              orgData.name || 'Organisasjonen',
              orgData.id || 'default-org',
              tempPassword,
              loginUrl,
              adminName
            );
            
            if (!emailResult.success) {
              emailErrors++;
            }
          }
        } catch (error) {
          emailErrors++;
        }
      }
      
      if (emailErrors > 0) {
        setError(`${pendingMembers.length} medlemmer godkjent, men ${emailErrors} e-poster kunne ikke sendes. Kontakt medlemmene manuelt.`);
        setTimeout(() => setError(null), 8000);
      }
    }
  };

  const handleUnapprove = async (memberId: string) => {
    if (window.confirm('Er du sikker på at du vil fjerne godkjenningen av dette medlemmet?')) {
      try {
        const { error } = await supabase
          .from('organization_members')
          .update({ approved: false })
          .eq('id', memberId);
        
        if (error) {
          throw new Error('Kunne ikke fjerne godkjenning');
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

  const handleSaveEdit = (updatedMember: OrganizationMember) => {
    setMembers(prev => prev.map(member =>
      member.id === updatedMember.id ? updatedMember : member
    ));
    setEditingMember(null);
  };

  const handleAddMember = (memberData: Omit<Member, 'id' | 'registrationDate' | 'approved'>) => {
    const newMember: Member = {
      id: Date.now(),
      ...memberData,
      registrationDate: new Date(),
      approved: false,
      role: 'user'
    };

    setMembers(prev => [...prev, newMember]);
    setShowAddModal(false);
  };

  const handleToggleAdmin = async (memberId: string) => {
    if (!canManageAdmins) return;
    
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const action = newRole === 'admin' ? 'gi admin-rettigheter til' : 'fjerne admin-rettigheter fra';
    
    if (window.confirm(`Er du sikker på at du vil ${action} ${member.full_name}?`)) {
      try {
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
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('id', memberId);
        
        if (error) {
          throw new Error('Kunne ikke slette medlem');
        }
        
        setMembers(prev => prev.filter(member => member.id !== memberId));
      } catch (error) {
        console.error('Error deleting member:', error);
        setError('Kunne ikke slette medlem');
      }
    }
  };
  
  const filteredAndSortedMembers = members
    .filter(member => 
      (member.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.member_number ?? '').includes(searchTerm)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'created_at') {
        comparison = new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
      } else if (sortField === 'full_name') {
        comparison = a.full_name.localeCompare(b.full_name);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const pendingMembers = filteredAndSortedMembers.filter(member => !member.approved);
  const approvedMembers = filteredAndSortedMembers.filter(member => member.approved);

  const totalPages = Math.ceil(approvedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentApprovedMembers = approvedMembers.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-svpk-yellow">{t('admin.member_management')}</h2>
          <p className="text-gray-400">
            {t('admin.description')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <PlusCircle className="w-5 h-5" />
          {t('admin.add_member')}
        </button>
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

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-svpk-yellow">
            {t('admin.pending_approvals')} ({pendingMembers.length})
          </h3>
          
          {pendingMembers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              {t('admin.no_pending_members')}
            </p>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleApproveAll}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {t('admin.approve_all')} ({pendingMembers.length})
                </button>
              </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th 
                      className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer hover:bg-gray-700 text-sm sm:text-base"
                      onClick={() => handleSort('fullName')}
                    >
                      <div className="flex items-center gap-2">
                        {t('admin.name')}
                        {sortField === 'fullName' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base hidden sm:table-cell">{t('admin.email')}</th>
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base">{t('admin.member_id')}</th>
                    <th 
                      className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer hover:bg-gray-700 text-sm sm:text-base hidden md:table-cell"
                      onClick={() => handleSort('registrationDate')}
                    >
                      <div className="flex items-center gap-2">
                        {t('admin.registered')}
                        {sortField === 'registrationDate' && (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    {canManageAdmins && <th className="py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base hidden lg:table-cell">{t('admin.role')}</th>}
                    <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-sm sm:text-base">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingMembers.map((member) => (
                    <tr key={member.id} className="border-b border-gray-700">
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base">
                        <div>
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-xs text-gray-400 sm:hidden">{member.email}</div>
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden sm:table-cell">{member.email}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base">{member.memberNumber}</td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden md:table-cell">
                        {format(member.registrationDate, 'dd.MM.yyyy')}
                      </td>
                      {canManageAdmins && (
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base hidden lg:table-cell">
                          <span className={`px-2 py-1 rounded text-xs ${
                            member.role === 'admin' 
                              ? 'bg-svpk-yellow text-black' 
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {member.role === 'admin' ? t('admin.admin_role') : t('admin.user_role')}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-2 sm:py-3 sm:px-4">
                        <div className="flex justify-end items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => handleApprove(member.id)}
                            className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-green-400"
                            title={t('admin.approve_member')}
                          >
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {canManageAdmins && (
                            <button
                              onClick={() => handleToggleAdmin(member.id)}
                              className={`p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors ${
                                member.role === 'admin' ? 'text-svpk-yellow' : 'text-gray-400'
                              }`}
                              title={t('admin.toggle_admin')}
                            >
                              {member.role === 'admin' ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> : <ShieldOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                            </button>
                          )}
                          <button
                            onClick={() => setEditingMember(member)}
                            className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors"
                            title={t('admin.edit_member')}
                          >
                            <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id, member.fullName)}
                            className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-red-400"
                            title="Slett medlem"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold">
            Godkjente medlemmer ({approvedMembers.length})
          </h3>
          
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th 
                    className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer hover:bg-gray-700 text-sm sm:text-base"
                    onClick={() => handleSort('fullName')}
                  >
                    <div className="flex items-center gap-2">
                      {t('admin.name')}
                      {sortField === 'fullName' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base hidden sm:table-cell">{t('admin.email')}</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base">{t('admin.member_id')}</th>
                  <th 
                    className="py-2 px-2 sm:py-3 sm:px-4 text-left cursor-pointer hover:bg-gray-700 text-sm sm:text-base hidden md:table-cell"
                    onClick={() => handleSort('registrationDate')}
                  >
                    <div className="flex items-center gap-2">
                      {t('admin.registered')}
                      {sortField === 'registrationDate' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  {canManageAdmins && <th className="py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base hidden lg:table-cell">{t('admin.role')}</th>}
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-sm sm:text-base">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {currentApprovedMembers.map((member) => (
                  <tr key={member.id} className="border-b border-gray-700">
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base">
                      <div>
                        <div className="font-medium">{member.fullName}</div>
                        <div className="text-xs text-gray-400 sm:hidden">{member.email}</div>
                        <div className="text-xs text-gray-400 md:hidden">
                          {format(member.registrationDate, 'dd.MM.yyyy')}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden sm:table-cell">{member.email}</td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base">{member.memberNumber}</td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden md:table-cell">
                      {format(member.registrationDate, 'dd.MM.yyyy')}
                    </td>
                    {canManageAdmins && (
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${
                          member.role === 'admin' 
                            ? 'bg-svpk-yellow text-black' 
                            : 'bg-gray-600 text-gray-300'
                        }`}>
                          {member.role === 'admin' ? t('admin.admin_role') : t('admin.user_role')}
                        </span>
                      </td>
                    )}
                    <td className="py-2 px-2 sm:py-3 sm:px-4">
                      <div className="flex justify-end items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleUnapprove(member.id)}
                          className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-green-400"
                          title={t('admin.unapprove_member')}
                        >
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {canManageAdmins && (
                          <button
                            onClick={() => handleToggleAdmin(member.id)}
                            className={`p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors ${
                              member.role === 'admin' ? 'text-svpk-yellow' : 'text-gray-400'
                            }`}
                            title={t('admin.toggle_admin')}
                          >
                            {member.role === 'admin' ? <Shield className="w-4 h-4 sm:w-5 sm:h-5" /> : <ShieldOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingMember(member)}
                          className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors"
                          title={t('admin.edit_member')}
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        {canManageAdmins && (
                          <button
                            onClick={() => handleDeleteMember(member.id, member.fullName)}
                            className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-red-400"
                            title="Slett medlem"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-400">
              {t('admin.showing_members', { 
                start: startIndex + 1, 
                end: Math.min(endIndex, approvedMembers.length), 
                total: approvedMembers.length 
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-secondary"
              >
                {t('admin.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-secondary"
              >
                {t('admin.next')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddMember}
        />
      )}

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