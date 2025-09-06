import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { addManualTrainingSession, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ManualTrainingSession } from '../lib/types';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// List of range officers
const rangeOfficers = [
  'Magne Angelsen',
  'Kenneth S. Fahle',
  'Knut Valle',
  'Yngve Rødli',
  'Bjørn-Kristian Pedersen',
  'Espen Johansen',
  'Kurt Wadel',
  'Carina Wadel'
].sort();

export function ManualTrainingModal({ onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeLocations, setRangeLocations] = useState<Array<{id: string, name: string}>>([]);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [approvedMembers, setApprovedMembers] = useState<string[]>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>(['Trening', 'Stevne', 'Dugnad']);
  const [formData, setFormData] = useState<ManualTrainingSession>({
    date: new Date().toISOString().split('T')[0],
    location: '',
    branch: 'NSF',
    notes: '',
    activity: 'Trening'
  });
  const [rangeOfficer, setRangeOfficer] = useState({
    name: '',
  });
  const [selectedMember, setSelectedMember] = useState('');
  const [customMember, setCustomMember] = useState('');
  const [isCustomMember, setIsCustomMember] = useState(false);
  const [isCustomRangeOfficer, setIsCustomRangeOfficer] = useState(false);

  // Load range locations and approved members on component mount
  React.useEffect(() => {
    const loadRangeLocations = async () => {
      try {
        setLoadingRanges(true);
        const { data, error } = await supabase
          .from('range_locations')
          .select('id, name')
          .order('name');

        if (error) throw error;
        
        setRangeLocations(data || []);
        
        // Set first range as default if available
        if (data && data.length > 0) {
          setFormData(prev => ({ ...prev, location: data[0].name }));
        }
      } catch (error) {
        console.error('Error loading range locations:', error);
        setError('Kunne ikke laste skytebaner');
      } finally {
        setLoadingRanges(false);
      }
    };

    const loadApprovedMembers = () => {
      try {
        const savedMembers = localStorage.getItem('members');
        if (savedMembers) {
          const members = JSON.parse(savedMembers);
          const approved = members
            .filter((member: any) => member.approved)
            .map((member: any) => member.fullName || member.full_name)
            .filter(Boolean)
            .sort();
          setApprovedMembers(approved);
          console.log('Loaded approved members for manual training:', approved);
        }
      } catch (error) {
        console.error('Error loading approved members:', error);
        setApprovedMembers([]);
      }
    };

    const loadActivityTypes = () => {
      try {
        const savedActivityTypes = localStorage.getItem('activityTypes');
        if (savedActivityTypes) {
          const types = JSON.parse(savedActivityTypes);
          setActivityTypes(types);
        } else {
          // Load from organization settings
          const savedOrg = localStorage.getItem('currentOrganization');
          if (savedOrg) {
            const orgData = JSON.parse(savedOrg);
            if (orgData.activity_types) {
              setActivityTypes(orgData.activity_types);
            }
          }
        }
      } catch (error) {
        console.error('Error loading activity types:', error);
        setActivityTypes(['Trening', 'Stevne', 'Dugnad']);
      }
    };

    loadRangeLocations();
    loadApprovedMembers();
    loadActivityTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const memberName = isCustomMember ? customMember : selectedMember;
    if (!memberName) {
      setError('Vennligst velg eller skriv inn et medlemsnavn');
      setIsSubmitting(false);
      return;
    }

    // Use current admin's name as range officer
    const adminName = profile?.full_name || 'Administrator';

    try {
      await addManualTrainingSession(
        { ...formData, memberName },
        rangeOfficer.name || adminName
      );
      
      // Force refresh of training data in parent component
      window.dispatchEvent(new CustomEvent('trainingDataUpdated'));
      
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Det oppstod en feil');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Registrer Manuell Treningsøkt</h3>
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
                Velg Medlem
              </label>
              <div className="space-y-2">
                <select
                  value={isCustomMember ? '' : selectedMember}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomMember(true);
                      setSelectedMember('');
                    } else {
                      setIsCustomMember(false);
                      setSelectedMember(e.target.value);
                    }
                  }}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                  disabled={isSubmitting}
                >
                  <option value="">Velg et medlem...</option>
                  {approvedMembers.map(member => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                  <option value="custom">Skriv inn annet navn...</option>
                </select>

                {isCustomMember && (
                  <input
                    type="text"
                    value={customMember}
                    onChange={(e) => setCustomMember(e.target.value)}
                    placeholder="Skriv inn medlemsnavn"
                    className="w-full bg-gray-700 rounded-md px-3 py-2"
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Dato
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Skytebane
              </label>
              {loadingRanges ? (
                <div className="w-full bg-gray-700 rounded-md px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Laster skytebaner...</span>
                </div>
              ) : (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Velg skytebane...</option>
                  {rangeLocations.map(range => (
                    <option key={range.id} value={range.name}>{range.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bransje
              </label>
              <select
                value={formData.branch || 'NSF'}
                onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                disabled={isSubmitting}
              >
                <option value="NSF">NSF</option>
                <option value="DSSN">DSSN</option>
                <option value="DFS">DFS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Aktivitet
              </label>
              <select
                value={formData.activity}
                onChange={(e) => setFormData(prev => ({ ...prev, activity: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                disabled={isSubmitting}
              >
                {activityTypes.map(activity => (
                  <option key={activity} value={activity}>{activity}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notater
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-24"
                placeholder="Valgfrie notater om treningsøkten"
                disabled={isSubmitting}
              />
            </div>

            <div className="border-t border-gray-700 my-6 pt-6">
              <h4 className="font-medium mb-4">Standplassleder</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Standplassleder (valgfritt)
                  </label>
                  <div className="space-y-2">
                    <select
                      value={isCustomRangeOfficer ? '' : rangeOfficer.name}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomRangeOfficer(true);
                          setRangeOfficer(prev => ({ ...prev, name: '' }));
                        } else {
                          setIsCustomRangeOfficer(false);
                          setRangeOfficer(prev => ({ ...prev, name: e.target.value }));
                        }
                      }}
                      className="w-full bg-gray-700 rounded-md px-3 py-2"
                      disabled={isSubmitting}
                    >
                      <option value="">Bruk mitt navn som standplassleder</option>
                      {rangeOfficers.map(officer => (
                        <option key={officer} value={officer}>{officer}</option>
                      ))}
                      <option value="custom">Skriv inn annet navn...</option>
                    </select>

                    {isCustomRangeOfficer && (
                      <input
                        type="text"
                        value={rangeOfficer.name}
                        onChange={(e) => setRangeOfficer(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Skriv inn standplassleder navn"
                        className="w-full bg-gray-700 rounded-md px-3 py-2"
                        disabled={isSubmitting}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Hvis ikke valgt, brukes ditt navn som standplassleder
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrerer...
                  </>
                ) : (
                  'Registrer Treningsøkt'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}