import React, { useState, useEffect } from 'react';
import { Download, Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Edit2, X, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService } from '../lib/database';
import { useRealtimeSubscription } from '../hooks/useRealtime';
import { verifyTrainingSession } from '../lib/supabase';
import type { MemberTrainingSession, OrganizationMember, TrainingLocation } from '../lib/types';

const rangeOfficers = [
  'Magne Angelsen', 
  'Kenneth S. Fahle', 
  'Knut Valle', 
  'Yngve Rødli'
].sort();

interface TrainingEntry {
  id: string;
  memberName: string;
  memberNumber?: string;
  range: string;
  activity: string;
  date: Date;
  approved: boolean;
  rangeOfficer: string;
  notes?: string;
}

interface EditModalProps {
  entry: TrainingEntry;
  onClose: () => void;
  onSave: (updatedEntry: TrainingEntry) => void;
  approvedMembers: OrganizationMember[];
  locations: TrainingLocation[];
}

function EditModal({ entry, onClose, onSave, approvedMembers, locations }: EditModalProps) {
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
                onChange={(e) => setEditedEntry((prev: TrainingEntry) => ({ ...prev, memberName: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="">Velg medlem...</option>
                {approvedMembers.map(member => (
                  <option key={member.id} value={member.full_name}>
                    {member.full_name} {member.member_number && `(${member.member_number})`}
                  </option>
                ))}
                {/* Fallback option if current member is not in approved list */}
                {editedEntry.memberName && !approvedMembers.find(m => m.full_name === editedEntry.memberName) && (
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
                onChange={(e) => setEditedEntry((prev: TrainingEntry) => ({ 
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
                onChange={(e) => setEditedEntry((prev: TrainingEntry) => ({ ...prev, range: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                {locations.map(location => (
                  <option key={location.id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Aktivitet
              </label>
              <select
                value={editedEntry.activity || 'Trening'}
                onChange={(e) => setEditedEntry((prev: TrainingEntry) => ({ ...prev, activity: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="Trening">Trening</option>
                <option value="Dugnad">Dugnad</option>
                <option value="Stevne">Stevne</option>
                <option value="Kurs">Kurs</option>
                <option value="Instruktørdugnad">Instruktørdugnad</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Standplassleder
              </label>
              <select
                value={editedEntry.rangeOfficer}
                onChange={(e) => setEditedEntry((prev: TrainingEntry) => ({ ...prev, rangeOfficer: e.target.value }))}
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
                    onChange={() => setEditedEntry((prev: TrainingEntry) => ({ ...prev, approved: true }))}
                    className="theme-primary-text"
                  />
                  <span>Verifisert</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!editedEntry.approved}
                    onChange={() => setEditedEntry((prev: TrainingEntry) => ({ ...prev, approved: false }))}
                    className="theme-primary-text"
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
  const { profile, organization } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRange, setFilterRange] = useState('');
  const [filterRangeOfficer, setFilterRangeOfficer] = useState('');
  const [filterApproved, setFilterApproved] = useState('');
  const [sortField, setSortField] = useState<'date' | 'memberName' | 'range'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingEntry, setEditingEntry] = useState<TrainingEntry | null>(null);
  
  // Database state
  const [logEntries, setLogEntries] = useState<TrainingEntry[]>([]);
  const [approvedMembers, setApprovedMembers] = useState<OrganizationMember[]>([]);
  const [locations, setLocations] = useState<TrainingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const itemsPerPage = 50;

  // Set up real-time subscription for training sessions
  useRealtimeSubscription(
    'member_training_sessions',
    organization ? `organization_id=eq.${organization.id}` : undefined,
    () => {
      if (organization?.id) {
        loadTrainingSessions();
      }
    }
  );

  // Load data from database
  useEffect(() => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    loadInitialData();
  }, [organization?.id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessions, members, trainingLocations] = await Promise.all([
        DatabaseService.getTrainingSessions(organization!.id),
        DatabaseService.getOrganizationMembers(organization!.id),
        DatabaseService.getTrainingLocations(organization!.id)
      ]);

      setLogEntries(transformTrainingSessions(sessions));
      setApprovedMembers(members.filter(m => m.approved));
      setLocations(trainingLocations);
    } catch (err) {
      console.error('Error loading training data:', err);
      setError('Kunne ikke laste treningsdata');
    } finally {
      setLoading(false);
    }
  };

  const loadTrainingSessions = async () => {
    if (!organization?.id) return;
    
    try {
      const sessions = await DatabaseService.getTrainingSessions(organization.id);
      setLogEntries(transformTrainingSessions(sessions));
    } catch (err) {
      console.error('Error reloading training sessions:', err);
    }
  };

  const transformTrainingSessions = (sessions: MemberTrainingSession[]): TrainingEntry[] => {
    return sessions.map(session => ({
      id: session.id,
      memberName: session.organization_members?.full_name || 'Ukjent medlem',
      memberNumber: session.organization_members?.member_number || undefined,
      range: session.training_locations?.name || 'Ukjent bane',
      activity: 'Trening', // Default since training_session_details might not be available
      date: new Date(session.start_time || new Date()),
      approved: session.verified || false,
      rangeOfficer: session.verified_by || 'Ikke godkjent',
      notes: session.notes || undefined
    }));
  };

  const handleSort = (field: 'date' | 'memberName' | 'range') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveEdit = async (updatedEntry: TrainingEntry) => {
    try {
      setProcessingId(updatedEntry.id);
      
      // Update the entry locally for immediate feedback
      setLogEntries(prev => prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      ));

      // TODO: Add actual database update logic here
      // For now, we'll just update the local state
      console.log('Would update database entry:', updatedEntry);
      
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating training entry:', error);
      // Revert local changes on error
      loadTrainingSessions();
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleStatus = async (entryId: string) => {
    try {
      setProcessingId(entryId);
      const adminName = profile?.full_name || 'Admin';
      const entry = logEntries.find(e => e.id === entryId);
      
      if (!entry) return;

      // Update locally for immediate feedback
      setLogEntries(prev => prev.map(entry => 
        entry.id === entryId ? { 
          ...entry, 
          approved: !entry.approved,
          rangeOfficer: !entry.approved ? adminName : 'Ikke godkjent'
        } : entry
      ));

      // Update in database
      if (!entry.approved) {
        await verifyTrainingSession(entryId, adminName);
      } else {
        // TODO: Add unverify functionality if needed
        console.log('Would unverify session:', entryId);
      }
    } catch (error) {
      console.error('Error toggling training session status:', error);
      // Revert local changes on error
      loadTrainingSessions();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const entry = logEntries.find(e => e.id === entryId);
      if (!entry) return;

      const confirmMessage = `Er du sikker på at du vil slette denne treningsøkten?\n\nMedlem: ${entry.memberName}\nDato: ${format(entry.date, 'dd.MM.yyyy')}\nBane: ${entry.range}`;
      
      if (!window.confirm(confirmMessage)) return;

      setProcessingId(entryId);

      // Update locally for immediate feedback
      setLogEntries(prev => prev.filter(e => e.id !== entryId));

      // Delete from database using supabase client directly
      const { supabase } = await import('../integrations/supabase/client');
      const { error } = await supabase
        .from('member_training_sessions')
        .delete()
        .eq('id', entryId);

      if (error) {
        throw new Error(error.message);
      }

      console.log('Training session deleted successfully:', entryId);
    } catch (error) {
      console.error('Error deleting training session:', error);
      // Revert local changes on error
      loadTrainingSessions();
      alert('Kunne ikke slette treningsøkten. Prøv igjen.');
    } finally {
      setProcessingId(null);
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

    function generatePDFContent() {
      // Add title - match new template format
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`TRENINGSLOGG - ${organization?.name || 'SVPK'} (Trening)`, 15, 20);

      // Add admin info section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Administrator: Admin`, 15, 35);
      doc.text(`Organisasjon: ${organization?.name || 'Ukjent'}`, 15, 42);
      doc.text(`Antall økter: ${filteredAndSortedData.length}`, 15, 49);

      // Add requirements status header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('KRAVSTATUS:', 15, 65);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Totalt ${filteredAndSortedData.length} registrerte treningsøkter`, 15, 75);

      // Table headers - match new template (removed "Status" column to fit landscape better)
      const headers = ['Dato', 'Aktivitet', 'Bane/sted', 'Verifisert av'];
      const columnWidths = [35, 50, 80, 60];
      let startY = 90;
      let startX = 15;

      // Add table border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
      doc.rect(startX, startY - 7, tableWidth, 12);

      // Add headers
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      headers.forEach((header, i) => {
        doc.text(header, startX + 2, startY);
        if (i < headers.length - 1) {
          doc.line(startX + columnWidths[i], startY - 7, startX + columnWidths[i], startY + 5);
        }
        startX += columnWidths[i];
      });

      // Add header bottom border
      doc.line(15, startY + 5, 15 + tableWidth, startY + 5);

      // Add data rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      let yPos = startY + 15;

      filteredAndSortedData.forEach((entry) => {
        if (yPos > 180) {
          doc.addPage();
          yPos = 40;
          
          // Re-add headers on new page
          startX = 15;
          doc.rect(startX, yPos - 7, tableWidth, 12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          headers.forEach((header, i) => {
            doc.text(header, startX + 2, yPos);
            if (i < headers.length - 1) {
              doc.line(startX + columnWidths[i], yPos - 7, startX + columnWidths[i], yPos + 5);
            }
            startX += columnWidths[i];
          });
          doc.line(15, yPos + 5, 15 + tableWidth, yPos + 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          yPos += 15;
        }

        startX = 15;
        
        // Add row border
        doc.rect(startX, yPos - 5, tableWidth, 10);
        
        // Date
        doc.setTextColor(0, 0, 0);
        doc.text(format(entry.date, 'dd.MM.yyyy'), startX + 2, yPos);
        doc.line(startX + columnWidths[0], yPos - 5, startX + columnWidths[0], yPos + 5);
        startX += columnWidths[0];
        
        // Activity
        doc.text(entry.activity || 'Trening', startX + 2, yPos);
        doc.line(startX + columnWidths[1], yPos - 5, startX + columnWidths[1], yPos + 5);
        startX += columnWidths[1];
        
        // Range
        doc.text(entry.range, startX + 2, yPos);
        doc.line(startX + columnWidths[2], yPos - 5, startX + columnWidths[2], yPos + 5);
        startX += columnWidths[2];

        // Range Officer
        doc.text(entry.rangeOfficer, startX + 2, yPos);

        yPos += 10;
      });

      // Add signature section - match new template
      yPos += 20;
      if (yPos > 140) {
        doc.addPage();
        yPos = 40;
      }

      // Signature section header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('SIGNATUR OG STEMPEL', 15, yPos);
      
      yPos += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Styremedlem/skyteleders signature
      doc.text('Styremedlem/skyteleders signatur:', 15, yPos);
      doc.line(80, yPos, 140, yPos);
      
      yPos += 15;
      doc.text('Dato:', 15, yPos);
      doc.line(30, yPos, 80, yPos);
      
      yPos += 15;
      doc.text('Signatur søker:', 15, yPos);
      doc.text('STEMPEL', 120, yPos);
      
      // Draw stamp box
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(110, yPos - 10, 30, 20);
      
      // Footer - match new template format
      yPos += 25;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`Generert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 15, yPos);
      
      yPos += 8;
      doc.text(`${organization?.name || 'Svolvær Pistolklubb'} - www.svpk.no`, 15, yPos);

      // Save and download the PDF
      const fileName = `SVPK_Treningslogg_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
    }
    
    // Generate PDF content directly (removing logo loading)
    generatePDFContent();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Laster treningsdata...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-500 rounded-lg">
        <p className="text-red-400">Feil: {error}</p>
        <button 
          onClick={loadInitialData}
          className="btn-secondary mt-2"
        >
          Prøv igjen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Komplett Treningslogg</h2>
          <p className="text-gray-400 text-sm mt-1">
            {organization?.name} - {logEntries.length} treningsøkter totalt
          </p>
        </div>
        <button
          onClick={generatePDF}
          className="btn-primary flex items-center gap-2"
          disabled={logEntries.length === 0}
        >
          <Download className="w-4 h-4" />
          Last ned PDF
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Søk etter medlem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <select
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="">Alle baner</option>
            {locations.map(location => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>

          <select
            value={filterRangeOfficer}
            onChange={(e) => setFilterRangeOfficer(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="">Alle standplassledere</option>
            {rangeOfficers.map(officer => (
              <option key={officer} value={officer}>{officer}</option>
            ))}
          </select>

          <select
            value={filterApproved}
            onChange={(e) => setFilterApproved(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
          >
            <option value="">Alle statuser</option>
            <option value="approved">Kun verifiserte</option>
            <option value="notApproved">Kun ikke-verifiserte</option>
          </select>
        </div>
      </div>

      {/* Training Log Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    Dato
                    {sortField === 'date' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('memberName')}
                >
                  <div className="flex items-center gap-2">
                    Medlem
                    {sortField === 'memberName' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Aktivitet</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleSort('range')}
                >
                  <div className="flex items-center gap-2">
                    Bane
                    {sortField === 'range' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Standplassleder</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    {searchTerm || filterRange || filterRangeOfficer || filterApproved 
                      ? 'Ingen treningsøkter matcher søkekriteriene' 
                      : 'Ingen treningsøkter funnet'
                    }
                  </td>
                </tr>
              ) : (
                currentData.map((entry, index) => (
                  <tr 
                    key={entry.id}
                    className={`border-t border-gray-700 hover:bg-gray-750 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                    }`}
                  >
                    <td className="px-4 py-3">
                      {format(entry.date, 'dd.MM.yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{entry.memberName}</div>
                        {entry.memberNumber && (
                          <div className="text-sm text-gray-400">#{entry.memberNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.activity}</td>
                    <td className="px-4 py-3">{entry.range}</td>
                    <td className="px-4 py-3">{entry.rangeOfficer}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.approved 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {entry.approved ? 'Verifisert' : 'Ikke verifisert'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="p-1 rounded text-blue-400 hover:text-blue-300 transition-colors"
                          title="Rediger"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(entry.id)}
                          disabled={processingId === entry.id}
                          className={`p-1 rounded transition-colors ${
                            entry.approved 
                              ? 'text-green-400 hover:text-green-300' 
                              : 'text-red-400 hover:text-red-300'
                          } disabled:opacity-50`}
                          title={entry.approved ? 'Fjern verifisering' : 'Verifiser'}
                        >
                          {processingId === entry.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : entry.approved ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={processingId === entry.id}
                          className="p-1 rounded text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          title="Slett"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Viser {(currentPage - 1) * itemsPerPage + 1} til {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} av {filteredAndSortedData.length} økter
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Forrige
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? 'bg-svpk-yellow text-gray-900'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                Neste
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEdit}
          approvedMembers={approvedMembers}
          locations={locations}
        />
      )}
    </div>
  );
}