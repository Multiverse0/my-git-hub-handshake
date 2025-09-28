import { useState, useEffect } from 'react';
import { QrCode, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader2, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { getOrganizationTrainingLocations, createTrainingLocation, updateTrainingLocation, supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TrainingLocation } from '../lib/types';

interface EditModalProps {
  location: TrainingLocation | null;
  onClose: () => void;
  onSave: (location: TrainingLocation) => void;
}

function EditModal({ location, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState<TrainingLocation>(
    location || {
      id: '',
      name: '',
      qr_code_id: '',
      description: '',
      active: true,
      nsf_enabled: true,
      dfs_enabled: false,
      dssn_enabled: false,
      organization_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  );
  const [error, setError] = useState<string | null>(null);

  const generateQRCode = (name: string, disciplines: { nsf: boolean; dfs: boolean; dssn: boolean }): string => {
    // Determine primary discipline (first enabled one)
    let prefix = '';
    if (disciplines.nsf) prefix = 'nsf';
    else if (disciplines.dfs) prefix = 'dfs';
    else if (disciplines.dssn) prefix = 'dssn';
    
    const cleanName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    
    return `${prefix}-${cleanName}-${randomSuffix}`;
  };

  const handleDisciplineChange = (discipline: string, enabled: boolean) => {
    const updatedData = {
      ...formData,
      [`${discipline}_enabled`]: enabled
    };
    
    // Update QR code when disciplines change and name exists
    if (updatedData.name) {
      const disciplines = {
        nsf: updatedData.nsf_enabled ?? false,
        dfs: updatedData.dfs_enabled ?? false,
        dssn: updatedData.dssn_enabled ?? false
      };
      updatedData.qr_code_id = generateQRCode(updatedData.name, disciplines);
    }
    
    setFormData(updatedData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.qr_code_id.trim()) {
      setError('Navn og QR-kode må fylles ut');
      return;
    }

    // Validate that at least one discipline is enabled
    if (!formData.nsf_enabled && !formData.dfs_enabled && !formData.dssn_enabled) {
      setError('Minst én skytedisiplin må være aktivert');
      return;
    }

    const updatedLocation = {
      ...formData,
      id: formData.id || Date.now().toString(),
      created_at: formData.created_at || new Date().toISOString()
    };

    onSave(updatedLocation);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              {location ? 'Rediger Skytebane' : 'Legg til Skytebane'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Navn på skytebane *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const disciplines = {
                    nsf: formData.nsf_enabled ?? false,
                    dfs: formData.dfs_enabled ?? false,
                    dssn: formData.dssn_enabled ?? false
                  };
                  setFormData(prev => ({ 
                    ...prev, 
                    name: newName,
                    qr_code_id: newName ? generateQRCode(newName, disciplines) : ''
                  }));
                }}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="F.eks. Innendørs 25m"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  QR-kode ID *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (formData.name) {
                      const disciplines = {
                        nsf: formData.nsf_enabled ?? false,
                        dfs: formData.dfs_enabled ?? false,
                        dssn: formData.dssn_enabled ?? false
                      };
                      setFormData(prev => ({ 
                        ...prev, 
                        qr_code_id: generateQRCode(formData.name, disciplines)
                      }));
                    }
                  }}
                  className="text-sm text-svpk-yellow hover:text-yellow-400"
                >
                  Generer automatisk
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.qr_code_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, qr_code_id: e.target.value }))}
                  className="w-full bg-gray-700 rounded-md px-3 py-2 pr-10"
                  placeholder="nsf-innendors-25m-abc1"
                  required
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(formData.qr_code_id)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  title="Kopier QR-kode"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Koden starter med disiplin (nsf-, dfs-, dssn-) og brukes til å generere QR-koder
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Beskrivelse (valgfritt)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-20"
                placeholder="Beskrivelse av skytebanen..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active ?? true}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="rounded border-gray-600"
              />
                <span className="text-sm font-medium text-gray-300">Aktiv skytebane</span>
              </label>
              <p className="text-xs text-gray-400 mt-1">
                Kun aktive skytebaner kan brukes for registrering
              </p>
            </div>

            {/* Shooting Disciplines */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Støttede skytedisipliner
              </label>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.nsf_enabled ?? true}
                    onChange={(e) => handleDisciplineChange('nsf', e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-300">NSF (Norges Skytterforbund)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.dfs_enabled ?? false}
                    onChange={(e) => handleDisciplineChange('dfs', e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-300">DFS (Dynamisk Feltskyting)</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.dssn_enabled ?? false}
                    onChange={(e) => handleDisciplineChange('dssn', e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <span className="text-sm text-gray-300">DSSN (Dynamisk Sportskyting Norge)</span>
                </label>
              </div>
              
              <p className="text-xs text-gray-400">
                Velg hvilke skytedisipliner som kan utføres på denne skytebanen
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button type="submit" className="btn-primary">
                {location ? 'Lagre endringer' : 'Legg til skytebane'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function QRCodeManagement() {
  const { organization } = useAuth();
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [editingLocation, setEditingLocation] = useState<TrainingLocation | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);


  const generateQRCodeURL = (location: TrainingLocation) => {
    const params = new URLSearchParams({
      qr_code: location.qr_code_id,
      name: location.name,
      org: organization?.name || 'SVPK',
      disciplines: [
        location.nsf_enabled && 'NSF',
        location.dfs_enabled && 'DFS', 
        location.dssn_enabled && 'DSSN'
      ].filter(Boolean).join(', '),
      description: location.description || ''
    });
    
    return `https://qr-code-generator-aktivlogg.lovable.app/?${params.toString()}`;
  };

  const generateAllQRCodesURL = () => {
    const activeLocations = locations.filter(loc => loc.active);
    if (activeLocations.length === 0) return '';
    
    const params = new URLSearchParams({
      org: organization?.name || 'SVPK',
      bulk: 'true',
      locations: JSON.stringify(
        activeLocations.map(loc => ({
          qr_code: loc.qr_code_id,
          name: loc.name,
          disciplines: [
            loc.nsf_enabled && 'NSF',
            loc.dfs_enabled && 'DFS',
            loc.dssn_enabled && 'DSSN'
          ].filter(Boolean).join(', '),
          description: loc.description || ''
        }))
      )
    });
    
    return `https://qr-code-generator-aktivlogg.lovable.app/?${params.toString()}`;
  };

  useEffect(() => {
    if (!organization?.id) return;
    
    const loadLocations = async () => {
      try {
        const result = await getOrganizationTrainingLocations(organization.id);
        if (result.error) {
          throw new Error(result.error);
        }
        
        setLocations(result.data || []);
      } catch (error) {
        console.error('Error loading QR locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    loadLocations();
  }, [organization?.id]);

  const handleSave = async (locationData: TrainingLocation) => {
    if (!organization?.id) return;
    
    try {
      if (editingLocation) {
        // Update existing
        const result = await updateTrainingLocation(locationData.id, {
          name: locationData.name,
          qr_code_id: locationData.qr_code_id,
          description: locationData.description || undefined,
          active: locationData.active,
          nsf_enabled: locationData.nsf_enabled,
          dfs_enabled: locationData.dfs_enabled,
          dssn_enabled: locationData.dssn_enabled
        });
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setLocations(prev => prev.map(loc => 
          loc.id === locationData.id ? result.data! : loc
        ));
      } else {
        // Create new
        const result = await createTrainingLocation(organization.id, {
          name: locationData.name,
          qr_code_id: locationData.qr_code_id,
          description: locationData.description || undefined,
          nsf_enabled: locationData.nsf_enabled ?? true,
          dfs_enabled: locationData.dfs_enabled ?? false,
          dssn_enabled: locationData.dssn_enabled ?? false
        });
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setLocations(prev => [...prev, result.data!]);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke lagre lokasjon');
    }
    
    setEditingLocation(null);
    setShowAddModal(false);
  };

  const handleDelete = async (locationId: string) => {
    if (window.confirm('Er du sikker på at du vil slette denne skytebanen?')) {
      try {
        const { error } = await supabase
          .from('training_locations')
          .delete()
          .eq('id', locationId);
        
        if (error) {
          throw new Error('Kunne ikke slette treningslokasjon');
        }
        
        setLocations(prev => prev.filter(loc => loc.id !== locationId));
      } catch (error) {
        console.error('Error deleting location:', error);
        setError('Kunne ikke slette treningslokasjon');
      }
    }
  };

  const handleToggleActive = async (locationId: string) => {
    try {
      const location = locations.find(loc => loc.id === locationId);
      if (!location) return;
      
      const result = await updateTrainingLocation(locationId, {
        active: !location.active
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setLocations(prev => prev.map(loc =>
        loc.id === locationId ? { ...loc, active: !loc.active } : loc
      ));
    } catch (error) {
      console.error('Error toggling location status:', error);
      setError('Kunne ikke endre status for treningslokasjon');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 text-svpk-yellow animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-svpk-yellow">QR-kode Administrasjon</h2>
          <p className="text-gray-400">
            Administrer QR-koder for skytebaner og treningslokasjoner
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Legg til skytebane
          </button>
          {locations.filter(loc => loc.active).length > 0 && (
            <a
              href={generateAllQRCodesURL()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Generer alle QR-koder
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <div className="card">
        {locations.length === 0 ? (
          <div className="text-center py-8">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Ingen skytebaner konfigurert</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Legg til første skytebane
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {locations.map((location) => (
              <div key={location.id} className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <QrCode className="w-6 h-6 text-svpk-yellow" />
                      <div>
                        <h3 className="text-lg font-semibold">{location.name}</h3>
                        <p className="text-sm text-gray-400">QR-kode: {location.qr_code_id}</p>
                      </div>
                    </div>
                    
                    {location.description && (
                      <p className="text-gray-300 mb-4">{location.description}</p>
                    )}
                    
                    {/* Shooting Disciplines */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {location.nsf_enabled && (
                        <span className="px-2 py-1 bg-svpk-yellow/20 text-svpk-yellow text-xs rounded-full">
                          NSF
                        </span>
                      )}
                      {location.dfs_enabled && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          DFS
                        </span>
                      )}
                      {location.dssn_enabled && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          DSSN
                        </span>
                      )}
                      {!location.nsf_enabled && !location.dfs_enabled && !location.dssn_enabled && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          Ingen disipliner aktivert
                        </span>
                      )}
                    </div>
                    
                    <div className="bg-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-300">QR-kode tekst:</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(location.qr_code_id)}
                          className="p-1 text-gray-400 hover:text-white"
                          title="Kopier QR-kode"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 font-mono break-all">
                        {location.qr_code_id}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={generateQRCodeURL(location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-svpk-yellow hover:text-yellow-300 hover:bg-svpk-yellow/10 rounded-full transition-colors"
                      title="Generer QR-kode"
                    >
                      <QrCode className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleToggleActive(location.id)}
                      className={`p-2 rounded-full transition-colors ${
                        location.active 
                          ? 'text-green-400 hover:text-green-300 hover:bg-green-400/10' 
                          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-400/10'
                      }`}
                      title={location.active ? 'Deaktiver skytebane' : 'Aktiver skytebane'}
                    >
                      {location.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingLocation(location)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors"
                      title="Rediger skytebane"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                      title="Slett skytebane"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Generator Tips Info Box */}
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <p className="text-yellow-200 text-sm leading-relaxed">
              <strong>Tips:</strong> Bruk "Generer QR-kode" knappen for hver skytebane for å lage profesjonelle, utskriftsvennlige QR-koder med{' '}
              <a 
                href="https://qr-code-generator-aktivlogg.lovable.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-yellow-300 hover:text-yellow-100 underline font-medium"
              >
                Aktivlogg QR Generator
              </a>
              . Generatoren er spesialtilpasset for SVPK og gir pene PDF-filer som kan skrives ut og henges på veggen.
            </p>
          </div>
        </div>
      </div>

      {/* Information section */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-svpk-yellow mb-4">Slik bruker medlemmer QR-kodene</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Medlemmet åpner QR-skanneren i appen</li>
            <li>Skanner QR-koden på skytebanen</li>
            <li>Treningsøkten registreres automatisk med riktig disiplin</li>
            <li>Skyteleder godkjenner økten</li>
          </ol>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-svpk-yellow mb-4">Tips for QR-kode generering</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
            <li>QR-koder starter med disiplin (nsf-, dfs-, dssn-)</li>
            <li>Bruk beskrivende navn som "innendors-25m" eller "feltbane-klasse2"</li>
            <li>Aktiver kun de disiplinene som faktisk kan utføres på banen</li>
            <li>Print ut QR-kodene og fest dem på skytebanen</li>
          </ul>
        </div>
      </div>

      {/* Modals */}
      {(editingLocation || showAddModal) && (
        <EditModal
          location={editingLocation}
          onClose={() => {
            setEditingLocation(null);
            setShowAddModal(false);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}