import React, { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { addManualTrainingSession, getOrganizationTrainingLocations, getOrganizationMembers } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, profile, organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingLocations, setTrainingLocations] = useState<Array<{id: string, name: string}>>([]);
  const [loadingRanges, setLoadingRanges] = useState(true);
  const [organizationMembers, setOrganizationMembers] = useState<Array<{id: string, full_name: string}>>([]);
  const [activityTypes, setActivityTypes] = useState<string[]>(['Trening', 'Stevne', 'Dugnad']);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    locationId: '',
    memberId: '',
    activity: 'Trening',
    notes: '',
  });

  // Load training locations and organization members
  React.useEffect(() => {
    if (!organization?.id) return;
    
    const loadData = async () => {
      try {
        setLoadingRanges(true);
        
        // Load training locations
        const locationsResult = await getOrganizationTrainingLocations(organization.id);
        if (locationsResult.data && locationsResult.data.length > 0) {
          setTrainingLocations(locationsResult.data);
          setFormData(prev => ({ ...prev, locationId: locationsResult.data![0].id }));
          }

        // Load organization members
        const membersResult = await getOrganizationMembers(organization.id);
        if (membersResult.data) {
          const approvedMembers = membersResult.data.filter(member => member.approved && member.active);
          setOrganizationMembers(approvedMembers);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Kunne ikke laste data');
      } finally {
        setLoadingRanges(false);
      }
    };


    loadData();
  }, [organization?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!formData.memberId || !formData.locationId || !organization?.id) {
      setError('Vennligst fyll ut alle påkrevde felt');
      setIsSubmitting(false);
      return;
    }


    try {
      const result = await addManualTrainingSession(
        organization.id,
        formData.memberId,
        formData.locationId,
        {
          date: formData.date,
          activity: formData.activity,
          notes: formData.notes
        },
        profile?.full_name || 'Administrator'
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error creating manual training session:', error);
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
                Medlem
              </label>
              <select
                value={formData.memberId}
                onChange={(e) => setFormData(prev => ({ ...prev, memberId: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                required
                disabled={isSubmitting}
              >
                <option value="">Velg medlem...</option>
                {organizationMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
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
                Treningslokasjon
              </label>
              {loadingRanges ? (
                <div className="w-full bg-gray-700 rounded-md px-3 py-2 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Laster lokasjoner...</span>
                </div>
              ) : (
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Velg lokasjon...</option>
                  {trainingLocations.map(location => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              )}
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