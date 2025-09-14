import React, { useState } from 'react';
import { Download, Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Edit2, X, Target } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const rangeOfficers = [
  'Magne Angelsen', 
  'Kenneth S. Fahle', 
  'Knut Valle', 
  'Yngve Rødli'
].sort();

interface EditModalProps {
  entry: any;
  onClose: () => void;
  onSave: (updatedEntry: any) => void;
  approvedMembers: string[];
}

function EditModal({ entry, onClose, onSave, approvedMembers }: EditModalProps) {
  const [editedEntry, setEditedEntry] = useState({ ...entry });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedEntry);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Rediger Treningsøkt</h3>
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
                value={editedEntry.memberName}
                onChange={(e) => setEditedEntry((prev: any) => ({ ...prev, memberName: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="">Velg medlem...</option>
                {approvedMembers.map(member => (
                  <option key={member} value={member}>{member}</option>
                ))}
                {/* Fallback option if current member is not in approved list */}
                {editedEntry.memberName && !approvedMembers.includes(editedEntry.memberName) && (
                  <option key={editedEntry.memberName} value={editedEntry.memberName}>
                    {editedEntry.memberName} (Ikke godkjent medlem)
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Dato
              </label>
              <input
                type="date"
                value={format(editedEntry.date, 'yyyy-MM-dd')}
                onChange={(e) => setEditedEntry((prev: any) => ({ 
                  ...prev, 
                  date: new Date(e.target.value) 
                }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bane
              </label>
              <select
                value={editedEntry.range}
                onChange={(e) => setEditedEntry((prev: any) => ({ ...prev, range: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="Innendørs 25m">Innendørs 25m</option>
                <option value="Utendørs 25m">Utendørs 25m</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Aktivitet
              </label>
              <select
                value={editedEntry.activity || 'Trening'}
                onChange={(e) => setEditedEntry((prev: any) => ({ ...prev, activity: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="Trening">Trening</option>
                <option value="Dugnad">Dugnad</option>
                <option value="Stevne">Stevne</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Standplassleder
              </label>
              <select
                value={editedEntry.rangeOfficer}
                onChange={(e) => setEditedEntry((prev: any) => ({ ...prev, rangeOfficer: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                {rangeOfficers.map(officer => (
                  <option key={officer} value={officer}>{officer}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={editedEntry.approved}
                    onChange={() => setEditedEntry((prev: any) => ({ ...prev, approved: true }))}
                    className="text-svpk-yellow"
                  />
                  <span>Verifisert</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!editedEntry.approved}
                    onChange={() => setEditedEntry((prev: any) => ({ ...prev, approved: false }))}
                    className="text-svpk-yellow"
                  />
                  <span>Ikke verifisert</span>
                </label>
              </div>
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

export function AdminFullTrainingLog() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRange, setFilterRange] = useState('');
  const [filterRangeOfficer, setFilterRangeOfficer] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [sortField, setSortField] = useState<'date' | 'memberName' | 'range'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [logEntries, setLogEntries] = useState<any[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<string[]>([]);
  const itemsPerPage = 50;

  // Dummy training log entries for demo
  const dummyLogEntries = [
    {
      id: 2001,
      memberName: 'Astrid Bergström',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2002,
      memberName: 'Magnus Haugen',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2003,
      memberName: 'Ingrid Svendsen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2004,
      memberName: 'Bjørn Kristoffersen',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2005,
      memberName: 'Solveig Dahl',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2006,
      memberName: 'Torstein Lie',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2007,
      memberName: 'Marit Sørensen',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2008,
      memberName: 'Geir Mikkelsen',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    // Additional training sessions with Norwegian names
    {
      id: 2009,
      memberName: 'Lise Andersen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2010,
      memberName: 'Per Olsen',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2011,
      memberName: 'Kari Nilsen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2012,
      memberName: 'Tom Hansen',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2013,
      memberName: 'Anne Larsen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2014,
      memberName: 'Bjørn Eriksen',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2015,
      memberName: 'Silje Pedersen',
      range: 'Innendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2016,
      memberName: 'Rune Kristiansen',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kurt Wadel'
    },
    {
      id: 2017,
      memberName: 'Hilde Johnsen',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Carina Wadel'
    },
    {
      id: 2018,
      memberName: 'Stein Haugen',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2019,
      memberName: 'Grete Svendsen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2020,
      memberName: 'Odd Martinsen',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2021,
      memberName: 'Berit Lund',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2022,
      memberName: 'Frode Bakken',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2023,
      memberName: 'Liv Strand',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2024,
      memberName: 'Gunnar Vik',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2025,
      memberName: 'Astrid Moen',
      range: 'Innendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kurt Wadel'
    },
    {
      id: 2026,
      memberName: 'Terje Solberg',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2027,
      memberName: 'Randi Berg',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Carina Wadel'
    },
    {
      id: 2028,
      memberName: 'Svein Dahl',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2029,
      memberName: 'Inger Holmen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2030,
      memberName: 'Nils Røed',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2031,
      memberName: 'Tone Foss',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2032,
      memberName: 'Kjell Myhre',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2033,
      memberName: 'Bente Lien',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2034,
      memberName: 'Arild Næss',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2035,
      memberName: 'Siri Haugen',
      range: 'Innendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kurt Wadel'
    },
    {
      id: 2036,
      memberName: 'Geir Strøm',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 36 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Carina Wadel'
    },
    {
      id: 2037,
      memberName: 'Karin Holm',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2038,
      memberName: 'Øyvind Lund',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2039,
      memberName: 'Mona Eide',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 39 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2040,
      memberName: 'Dag Ruud',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2041,
      memberName: 'Eli Bjerke',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 41 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2042,
      memberName: 'Pål Aasen',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2043,
      memberName: 'Gerd Moen',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2044,
      memberName: 'Leif Strand',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kurt Wadel'
    },
    {
      id: 2045,
      memberName: 'Aud Bakke',
      range: 'Innendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Carina Wadel'
    },
    {
      id: 2046,
      memberName: 'Roar Lie',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2047,
      memberName: 'Solveig Vik',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2048,
      memberName: 'Trond Eiken',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2049,
      memberName: 'Vigdis Rød',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Knut Valle'
    },
    {
      id: 2050,
      memberName: 'Helge Moe',
      range: 'Utendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2051,
      memberName: 'Turid Ås',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 51 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Yngve Rødli'
    },
    {
      id: 2052,
      memberName: 'Ivar Sæther',
      range: 'Utendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Espen Johansen'
    },
    {
      id: 2053,
      memberName: 'Reidun Krog',
      range: 'Innendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kurt Wadel'
    },
    {
      id: 2054,
      memberName: 'Steinar Hagen',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 54 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    },
    {
      id: 2055,
      memberName: 'Laila Berge',
      range: 'Innendørs 25m',
      activity: 'Dugnad',
      date: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Carina Wadel'
    },
    {
      id: 2056,
      memberName: 'Ragnar Torp',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 56 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Magne Angelsen'
    },
    {
      id: 2057,
      memberName: 'Unni Lunde',
      range: 'Innendørs 25m',
      activity: 'Stevne',
      date: new Date(Date.now() - 57 * 24 * 60 * 60 * 1000),
      approved: true,
      rangeOfficer: 'Kenneth S. Fahle'
    },
    {
      id: 2058,
      memberName: 'Einar Borg',
      range: 'Utendørs 25m',
      activity: 'Trening',
      date: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
      approved: false,
      rangeOfficer: 'Ikke godkjent'
    }
  ];

  // Load training sessions from localStorage
  React.useEffect(() => {
    const loadTrainingSessions = () => {
      try {
        const savedSessions = localStorage.getItem('trainingSessions');
        const sessions = savedSessions ? JSON.parse(savedSessions) : [];
        
        const formattedSessions = sessions.map((session: any) => ({
          id: session.id,
          memberName: session.memberName || 'Ukjent medlem',
          range: session.location || session.rangeName || 'Ukjent bane',
          activity: session.activity || 'Trening',
          date: new Date(session.date),
          approved: session.verified || session.approved || false,
          rangeOfficer: session.verifiedBy || session.rangeOfficer || 'Ikke godkjent'
        }));
        
        // Combine with dummy data
        const allEntries = [...dummyLogEntries, ...formattedSessions];
        setLogEntries(allEntries);
      } catch (error) {
        console.error('Error loading training sessions:', error);
        setLogEntries(dummyLogEntries); // Fallback to dummy data
      }
    };

    const loadApprovedMembers = () => {
      try {
        const savedMembers = localStorage.getItem('members');
        const members = savedMembers ? JSON.parse(savedMembers) : [];
        
        const approved = members
          .filter((member: any) => member.approved)
          .map((member: any) => member.fullName)
          .filter(Boolean);
        
        // Add dummy member names
        const dummyMemberNames = [
          'Astrid Bergström', 'Magnus Haugen', 'Ingrid Svendsen', 
          'Bjørn Kristoffersen', 'Solveig Dahl', 'Torstein Lie',
          'Marit Sørensen', 'Geir Mikkelsen', 'Lise Andersen',
          'Per Olsen', 'Kari Nilsen', 'Tom Hansen'
        ];
        
        const allApproved = [...new Set([...approved, ...dummyMemberNames])].sort();
        setApprovedMembers(allApproved);
      } catch (error) {
        console.error('Error loading approved members:', error);
        // Fallback to dummy member names
        setApprovedMembers([
          'Astrid Bergström', 'Magnus Haugen', 'Ingrid Svendsen', 
          'Bjørn Kristoffersen', 'Solveig Dahl', 'Torstein Lie',
          'Marit Sørensen', 'Geir Mikkelsen'
        ]);
      }
    };

    loadTrainingSessions();
    loadApprovedMembers();

    // Listen for changes in localStorage
    const handleStorageChange = () => {
      loadTrainingSessions();
      loadApprovedMembers();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check for updates every second
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem('trainingLogLastUpdate');
      if (lastUpdate) {
        loadTrainingSessions();
        loadApprovedMembers();
        localStorage.removeItem('trainingLogLastUpdate');
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSort = (field: 'date' | 'memberName' | 'range') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveEdit = (updatedEntry: any) => {
    setLogEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ));
    
    // Update localStorage as well
    try {
      const savedSessions = localStorage.getItem('trainingSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const updatedSessions = sessions.map((session: any) => 
          session.id === updatedEntry.id ? {
            ...session,
            memberName: updatedEntry.memberName,
            location: updatedEntry.range,
            rangeName: updatedEntry.range,
            verified: updatedEntry.approved,
            approved: updatedEntry.approved,
            verifiedBy: updatedEntry.rangeOfficer,
            rangeOfficer: updatedEntry.rangeOfficer
          } : session
        );
        localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
    
    setEditingEntry(null);
  };

  const handleToggleStatus = (entryId: number) => {
    const adminName = profile?.full_name || 'Admin';
    
    setLogEntries(prev => prev.map(entry => 
      entry.id === entryId ? { 
        ...entry, 
        approved: !entry.approved,
        rangeOfficer: !entry.approved ? adminName : 'Ikke godkjent'
      } : entry
    ));
    
    // Update localStorage as well
    try {
      const savedSessions = localStorage.getItem('trainingSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const updatedSessions = sessions.map((session: any) => 
          session.id == entryId ? {
            ...session,
            verified: !session.verified,
            approved: !session.approved,
            verifiedBy: !session.verified ? adminName : undefined,
            rangeOfficer: !session.verified ? adminName : undefined
          } : session
        );
        localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
      }
    } catch (error) {
      console.error('Error updating localStorage:', error);
    }
  };

  const filteredAndSortedData = logEntries
    .filter(entry => {
      const matchesSearch = entry.memberName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRange = !filterRange || entry.range === filterRange;
      const matchesRangeOfficer = !filterRangeOfficer || entry.rangeOfficer === filterRangeOfficer;
      const matchesApproved = !filterApproved || 
                            (filterApproved === 'approved' && entry.approved) ||
                            (filterApproved === 'notApproved' && !entry.approved);
      return matchesSearch && matchesRange && matchesRangeOfficer && matchesApproved;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = a.date.getTime() - b.date.getTime();
      } else if (sortField === 'memberName') {
        comparison = a.memberName.localeCompare(b.memberName);
      } else if (sortField === 'range') {
        comparison = a.range.localeCompare(b.range);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const currentData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // SVPK logo URL
    const SVPK_LOGO_URL = 'https://medlem.svpk.no/wp-content/uploads/2025/01/Logo-SVPK-orginal.png';

    // Try to add logo
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          doc.addImage(img, 'PNG', 15, 8, 30, 15);
        }
        generatePDFContent();
      };
      
      img.onerror = () => {
        console.warn('Logo could not be loaded, continuing without logo');
        generatePDFContent();
      };
      
      img.src = SVPK_LOGO_URL;
    } catch (error) {
      console.warn('Error loading logo, continuing without logo:', error);
      generatePDFContent();
    }

    function generatePDFContent() {
      // Add title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('SVPK Treningslogg - Full Oversikt', 50, 18);

      // Add generation info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 50, 30);
      doc.text(`Totalt antall økter: ${filteredAndSortedData.length}`, 50, 35);

      // Table headers - removed duration column
      const headers = ['Dato', 'Medlem', 'Aktivitet', 'Bane', 'Standplassleder', 'Status'];
      const columnWidths = [25, 50, 25, 35, 40, 25];
      let startY = 45;
      let startX = 15;

      // Add header background
      doc.setFillColor(255, 215, 0); // SVPK yellow
      doc.rect(startX, startY - 5, columnWidths.reduce((a, b) => a + b, 0), 10, 'F');

      // Add headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      headers.forEach((header, i) => {
        doc.text(header, startX + 1, startY);
        startX += columnWidths[i];
      });

      // Add data rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      let yPos = startY + 10;

      filteredAndSortedData.forEach((entry, index) => {
        if (yPos > 180) {
          doc.addPage();
          yPos = 40;
          
          // Re-add headers on new page
          doc.setFillColor(255, 215, 0);
          doc.rect(15, yPos - 5, columnWidths.reduce((a, b) => a + b, 0), 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          let headerX = 15;
          headers.forEach((header, i) => {
            doc.text(header, headerX + 1, yPos);
            headerX += columnWidths[i];
          });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          yPos += 10;
        }

        // Add alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(15, yPos - 2, columnWidths.reduce((a, b) => a + b, 0), 5, 'F');
        }

        startX = 15;
        
        // Date
        doc.setTextColor(0, 0, 0);
        doc.text(format(entry.date, 'dd.MM.yyyy'), startX + 1, yPos);
        startX += columnWidths[0];
        
        // Member
        doc.text(entry.memberName, startX + 1, yPos);
        startX += columnWidths[1];
        
        // Activity
        doc.text(entry.activity || 'Trening', startX + 1, yPos);
        startX += columnWidths[2];
        
        // Range
        doc.text(entry.range, startX + 1, yPos);
        startX += columnWidths[3];

        // Range Officer
        doc.text(entry.rangeOfficer, startX + 1, yPos);
        startX += columnWidths[4];
        
        // Status - green color for verified
        if (entry.approved) {
          doc.setTextColor(0, 128, 0); // Green color
          doc.text('Verifisert', startX + 1, yPos);
        } else {
          doc.setTextColor(255, 0, 0); // Red color
          doc.text('Ikke verifisert', startX + 1, yPos);
        }
        doc.setTextColor(0, 0, 0); // Reset to black

        yPos += 8;
      });

      // Add signature field at bottom
      yPos += 15;
      if (yPos > 170) {
        doc.addPage();
        yPos = 40;
      }

      // Signature section
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      
      // Signature box
      doc.rect(15, yPos, 120, 30);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('SIGNATUR OG STEMPEL', 17, yPos + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Styremedlem signatur:', 17, yPos + 12);
      doc.text('Dato:', 17, yPos + 20);
      doc.text('Stempel:', 17, yPos + 28);
      
      // Signature lines
      doc.line(50, yPos + 12, 110, yPos + 12); // Signature line
      doc.line(30, yPos + 20, 70, yPos + 20);  // Date line
      
      // Stamp area
      doc.setDrawColor(200, 200, 200);
      doc.rect(80, yPos + 22, 25, 15);
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text('STEMPEL', 85, yPos + 30);
      
      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 200, yPos + 35);
      doc.text('Svolvær Pistolklubb - www.svpk.no', 200, yPos + 40);

      doc.save('SVPK-full-treningslogg.pdf');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-svpk-yellow">Full Treningslogg</h2>
          <p className="text-gray-400">Komplett oversikt over alle treningsøkter med klikkbare status-ikoner</p>
        </div>
        <button
          onClick={generatePDF}
          className="btn-primary"
        >
          <Download className="w-5 h-5" />
          Last ned PDF
        </button>
      </div>

      {/* Filtering Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Filtrer treningsøkter</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Søk etter medlem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 rounded-lg pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <div>
            <select
              value={filterRange}
              onChange={(e) => setFilterRange(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="">Alle baner</option>
              <option value="Innendørs 25m">Innendørs 25m</option>
              <option value="Utendørs 25m">Utendørs 25m</option>
            </select>
          </div>
          <div>
            <select
              value={filterRangeOfficer}
              onChange={(e) => setFilterRangeOfficer(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="">Alle standplassledere</option>
              {rangeOfficers.map(officer => (
                <option key={officer} value={officer}>{officer}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterApproved}
              onChange={(e) => setFilterApproved(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="">Alle statuser</option>
              <option value="approved">Verifisert</option>
              <option value="notApproved">Ikke verifisert</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-400">
          Viser {filteredAndSortedData.length} av {logEntries.length} treningsøkter
        </div>
      </div>

      {/* Training Sessions Table */}
      <div className="card">
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            💡 <strong>Tips:</strong> Klikk på status-ikonene for å endre mellom verifisert/ikke verifisert
          </p>
        </div>

        {filteredAndSortedData.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Ingen treningsøkter funnet</p>
            <p className="text-sm text-gray-500">
              Prøv å endre filtrene for å se flere treningsøkter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th 
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Dato
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('memberName')}
                  >
                    <div className="flex items-center gap-2">
                      Medlem
                      {sortField === 'memberName' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left">Aktivitet</th>
                  <th 
                    className="py-3 px-4 text-left cursor-pointer hover:bg-gray-700"
                    onClick={() => handleSort('range')}
                  >
                    <div className="flex items-center gap-2">
                      Bane
                      {sortField === 'range' && (
                        sortDirection === 'asc' ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left">Standplassleder</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-3 px-4">{format(entry.date, 'dd.MM.yyyy')}</td>
                    <td className="py-3 px-4 font-medium">{entry.memberName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                        {entry.activity || 'Trening'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{entry.range}</td>
                    <td className="py-3 px-4">{entry.rangeOfficer}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(entry.id)}
                        className="p-1 hover:bg-gray-600 rounded-full transition-colors"
                        title={entry.approved ? 'Klikk for å sette til ikke verifisert' : 'Klikk for å verifisere'}
                      >
                        {entry.approved ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-2 text-blue-400 hover:text-blue-300"
                          title={t('admin.edit_session')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-400">
            {t('admin.showing_entries', { 
              start: (currentPage - 1) * itemsPerPage + 1, 
              end: Math.min(currentPage * itemsPerPage, filteredAndSortedData.length), 
              total: filteredAndSortedData.length 
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

      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEdit}
          approvedMembers={approvedMembers}
        />
      )}
    </div>
  );
}