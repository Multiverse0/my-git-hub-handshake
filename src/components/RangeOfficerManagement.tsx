import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, CheckCircle, XCircle, PlusCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { setUserContext } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../lib/database';
import type { OrganizationMember } from '../lib/types';

interface EditModalProps {
  officer: OrganizationMember | null;
  onClose: () => void;
  onSave: (officer: Partial<OrganizationMember>) => void;
}

function EditModal({ officer, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState({
    full_name: officer?.full_name || '',
    email: officer?.email || '',
    active: officer?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('Alle felt må fylles ut');
      return;
    }
    onSave({
      ...(officer || {}),
      full_name: formData.full_name,
      email: formData.email,
      active: formData.active,
      role: 'range_officer'  // Ensure role is set to range_officer
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {officer ? 'Rediger Standplassleder' : 'Legg til Standplassleder'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Navn
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
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
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="navn@example.com"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded border-gray-600"
                />
                <span className="text-sm font-medium text-gray-300">Aktiv</span>
              </label>
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
                {officer ? 'Lagre endringer' : 'Legg til'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RangeOfficerManagement() {
  const { organization, user } = useAuth();
  const [officers, setOfficers] = useState<OrganizationMember[]>([]);
  const [editingOfficer, setEditingOfficer] = useState<OrganizationMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch range officers from database
  const fetchRangeOfficers = async () => {
    if (!organization?.id) return;
    
    try {
      setError(null);
      const members = await DatabaseService.getOrganizationMembers(organization.id);
      
      // Filter for range officers only
      const rangeOfficers = members.filter(member => 
        member.role === 'range_officer' && member.approved
      );
      
      setOfficers(rangeOfficers);
    } catch (error) {
      console.error('Error fetching range officers:', error);
      setError('Kunne ikke laste standplassledere');
    } finally {
      setLoading(false);
    }
  };

  // Load officers when component mounts or organization changes
  useEffect(() => {
    fetchRangeOfficers();
  }, [organization?.id]);

  // Set up real-time subscription for organization members
  useEffect(() => {
    if (!organization?.id) return;

    const channel = supabase
      .channel('range-officers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members',
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          console.log('Range officer change detected:', payload);
          // Refetch data when changes occur
          fetchRangeOfficers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organization?.id]);

  const handleSave = async (updatedOfficer: Partial<OrganizationMember>) => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Ensure user is authenticated
      if (!user?.email) {
        throw new Error('Du må være innlogget for å administrere standplassledere');
      }

      console.log('Setting user context for:', user.email);
      
      // Set user context for RLS policies
      await setUserContext(user.email);

      console.log('Saving range officer:', updatedOfficer);
      
      if (editingOfficer) {
        // Update existing officer
        const { error } = await supabase
          .from('organization_members')
          .update({
            full_name: updatedOfficer.full_name,
            email: updatedOfficer.email,
            active: updatedOfficer.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOfficer.id);
        
        if (error) throw error;
      } else {
        // Add new officer
        const { error } = await supabase
          .from('organization_members')
          .insert([{
            organization_id: organization.id,
            full_name: updatedOfficer.full_name!,
            email: updatedOfficer.email!,
            role: 'range_officer',
            active: updatedOfficer.active ?? true,
            approved: true, // Auto-approve range officers added by admin
          }]);
        
        if (error) throw error;
      }
      
      console.log('Range officer saved successfully');
      
      // Refresh the list
      await fetchRangeOfficers();
      
      setEditingOfficer(null);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving officer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Kunne ikke lagre standplassleder';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (officer: OrganizationMember) => {
    if (!window.confirm('Er du sikker på at du vil slette denne standplasslederen?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', officer.id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchRangeOfficers();
    } catch (error) {
      console.error('Error deleting officer:', error);
      setError('Kunne ikke slette standplassleder');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (officer: OrganizationMember) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('organization_members')
        .update({
          active: !officer.active,
          updated_at: new Date().toISOString()
        })
        .eq('id', officer.id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchRangeOfficers();
    } catch (error) {
      console.error('Error toggling officer status:', error);
      setError('Kunne ikke oppdatere status');
    } finally {
      setLoading(false);
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-400">Ingen organisasjon valgt</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-svpk-yellow">Administrer standplassledere</h2>
          <p className="text-gray-400">
            Legg til, rediger eller deaktiver standplassledere
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          disabled={loading}
        >
          <PlusCircle className="w-5 h-5" />
          Legg til ny
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-svpk-yellow"></div>
          </div>
        ) : officers.length === 0 ? (
          <div className="text-center p-8">
            <p className="text-gray-400 mb-4">Ingen standplassledere funnet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <PlusCircle className="w-5 h-5" />
              Legg til første standplassleder
            </button>
          </div>
        ) : (
          <div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base">Navn</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base hidden sm:table-cell">E-post</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-left text-sm sm:text-base hidden md:table-cell">Lagt til</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-center text-sm sm:text-base">Status</th>
                  <th className="py-2 px-2 sm:py-3 sm:px-4 text-right text-sm sm:text-base">Handling</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer.id} className="border-b border-gray-700">
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base">
                      <div>
                        <div className="font-medium">{officer.full_name}</div>
                        <div className="text-xs text-gray-400 sm:hidden">{officer.email}</div>
                        <div className="text-xs text-gray-400 md:hidden">
                          {officer.created_at && new Date(officer.created_at).toLocaleDateString('nb-NO')}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden sm:table-cell">{officer.email}</td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden md:table-cell">
                      {officer.created_at && new Date(officer.created_at).toLocaleDateString('nb-NO')}
                    </td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleActive(officer)}
                          className={`flex items-center gap-1 px-1 py-1 rounded ${
                            officer.active 
                              ? 'text-green-400 hover:bg-green-400/10' 
                              : 'text-red-400 hover:bg-red-400/10'
                          }`}
                          disabled={loading}
                        >
                          {officer.active ? (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-2 sm:py-3 sm:px-4">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => setEditingOfficer(officer)}
                          className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors"
                          disabled={loading}
                        >
                          <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(officer)}
                          className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-red-400"
                          disabled={loading}
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
        )}
      </div>

      {(editingOfficer || showAddModal) && (
        <EditModal
          officer={editingOfficer}
          onClose={() => {
            setEditingOfficer(null);
            setShowAddModal(false);
            setError(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}