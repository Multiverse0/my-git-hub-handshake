import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { OrganizationMember } from '../lib/types';

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (member: Partial<OrganizationMember>) => void;
}

export function AddMemberModal({ onClose, onSave }: AddMemberModalProps) {
  const [formData, setFormData] = useState<{
    full_name: string;
    email: string;
    member_number: string;
    role: 'member' | 'admin' | 'range_officer';
  }>({
    full_name: '',
    email: '',
    member_number: '',
    role: 'member',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError('Navn og e-post må fylles ut');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Ugyldig e-postadresse');
      return;
    }
    
    onSave({
      full_name: formData.full_name.trim(),
      email: formData.email.toLowerCase().trim(),
      member_number: formData.member_number.trim() || undefined,
      role: formData.role,
      approved: true, // Auto-approve members added by admin
      active: true,
    });
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
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Fullt navn *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="Skriv inn fullt navn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                E-postadresse *
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                SkytterID (valgfritt)
              </label>
              <input
                type="text"
                value={formData.member_number}
                onChange={(e) => setFormData(prev => ({ ...prev, member_number: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
                placeholder="Skriv inn SkytterID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'member' | 'admin' | 'range_officer' }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="member">Medlem</option>
                <option value="admin">Admin</option>
                <option value="range_officer">Standplassleder</option>
              </select>
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
                Legg til medlem
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}