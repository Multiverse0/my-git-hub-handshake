import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, CheckCircle, XCircle, PlusCircle, AlertCircle } from 'lucide-react';

interface RangeOfficer {
  id: number;
  name: string;
  email: string;
  active: boolean;
  addedDate: Date;
}

// Super user admin only
const dummyRangeOfficers: RangeOfficer[] = [
  {
    id: 3001,
    name: 'Magne Angelsen',
    email: 'magne.angelsen@svpk.no',
    active: true,
    addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  },
  {
    id: 3002,
    name: 'Kenneth S. Fahle',
    email: 'kenneth.fahle@svpk.no',
    active: true,
    addedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) // 25 days ago
  },
  {
    id: 3003,
    name: 'Knut Valle',
    email: 'knut.valle@svpk.no',
    active: true,
    addedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 days ago
  },
  {
    id: 3004,
    name: 'Kurt Wadel',
    email: 'kurt.wadel@svpk.no',
    active: true,
    addedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
  },
  {
    id: 3005,
    name: 'Carina Wadel',
    email: 'carina.wadel@svpk.no',
    active: true,
    addedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  },
  {
    id: 3006,
    name: 'Yngve Rødli',
    email: 'yngve@promonorge.no',
    active: true,
    addedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  }
];

const initialRangeOfficers: RangeOfficer[] = [];

interface EditModalProps {
  officer: RangeOfficer | null;
  onClose: () => void;
  onSave: (officer: RangeOfficer) => void;
}

function EditModal({ officer, onClose, onSave }: EditModalProps) {
  const [formData, setFormData] = useState(
    officer || {
      id: Date.now(),
      name: '',
      email: '',
      active: true,
      addedDate: new Date()
    }
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Alle felt må fylles ut');
      return;
    }
    onSave(formData);
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
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
  const [officers, setOfficers] = useState<RangeOfficer[]>(initialRangeOfficers);
  const [editingOfficer, setEditingOfficer] = useState<RangeOfficer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load officers from localStorage on component mount
  useEffect(() => {
    const loadOfficers = () => {
      try {
        const savedOfficers = localStorage.getItem('rangeOfficers');
        const savedOfficersData = savedOfficers ? JSON.parse(savedOfficers) : [];
        
        const parsedOfficers = savedOfficersData.map((officer: any) => ({
          ...officer,
          addedDate: new Date(officer.addedDate)
        }));
        
        // Combine with dummy data
        const allOfficers = [...dummyRangeOfficers, ...parsedOfficers];
        setOfficers(allOfficers);
      } catch (error) {
        console.error('Error loading officers:', error);
        setOfficers(dummyRangeOfficers); // Fallback to dummy data
      } finally {
        setLoading(false);
      }
    };

    loadOfficers();
  }, []);

  // Save officers to localStorage whenever officers change
  useEffect(() => {
    if (!loading && officers.length > 0) {
      localStorage.setItem('rangeOfficers', JSON.stringify(officers));
    }
  }, [officers, loading]);

  const handleSave = (updatedOfficer: RangeOfficer) => {
    if (editingOfficer) {
      setOfficers(prev => prev.map(officer => 
        officer.id === updatedOfficer.id ? updatedOfficer : officer
      ));
    } else {
      setOfficers(prev => [...prev, updatedOfficer]);
    }
    setEditingOfficer(null);
    setShowAddModal(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Er du sikker på at du vil slette denne standplasslederen?')) {
      setOfficers(prev => prev.filter(officer => officer.id !== id));
    }
  };

  const handleToggleActive = (id: number) => {
    setOfficers(prev => prev.map(officer =>
      officer.id === id ? { ...officer, active: !officer.active } : officer
    ));
  };

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
        >
          <PlusCircle className="w-5 h-5" />
          Legg til ny
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-svpk-yellow"></div>
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
                      <div className="font-medium">{officer.name}</div>
                      <div className="text-xs text-gray-400 sm:hidden">{officer.email}</div>
                      <div className="text-xs text-gray-400 md:hidden">
                        {officer.addedDate.toLocaleDateString('nb-NO')}
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden sm:table-cell">{officer.email}</td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4 text-sm sm:text-base hidden md:table-cell">
                    {officer.addedDate.toLocaleDateString('nb-NO')}
                  </td>
                  <td className="py-2 px-2 sm:py-3 sm:px-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleToggleActive(officer.id)}
                        className={`flex items-center gap-1 px-1 py-1 rounded ${
                          officer.active 
                            ? 'text-green-400 hover:bg-green-400/10' 
                            : 'text-red-400 hover:bg-red-400/10'
                        }`}
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
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(officer.id)}
                        className="p-1 sm:p-2 hover:bg-gray-700 rounded-full transition-colors text-red-400"
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
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}