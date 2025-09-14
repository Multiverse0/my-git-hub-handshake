import React, { useState, useEffect } from 'react';
import { Download, Calendar, Target, CheckCircle, Plus, Edit2, X, Save, Upload, Trash2 } from 'lucide-react';
import { format, subMonths, isAfter } from 'date-fns';
import { jsPDF } from 'jspdf';
import { useDropzone } from 'react-dropzone';
import { getMemberTrainingSessions, updateTrainingDetails } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ManualTrainingModal } from '../components/ManualTrainingModal';
import { safeDate } from '../lib/typeUtils';
import type { MemberTrainingSession } from '../lib/types';

interface TrainingEntry {
  id: string;
  date: Date;
  location: string;
  duration: string;
  verified: boolean;
  verifiedBy?: string;
  activity?: string;
  organization?: string;
}

interface TrainingDetails {
  training_type?: string;
  results?: string;
  notes?: string;
  target_images?: string[];
}

interface EditTrainingModalProps {
  entry: TrainingEntry & { details?: TrainingDetails };
  onClose: () => void;
  onSave: (updatedEntry: TrainingEntry & { details?: TrainingDetails }) => void;
}

function EditTrainingModal({ entry, onClose, onSave }: EditTrainingModalProps) {
  const { t } = useLanguage();
  const [details, setDetails] = useState<TrainingDetails>(entry.details || {});
  const [uploadingImages, setUploadingImages] = useState(false);

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      setUploadingImages(true);
      
      const imagePromises = acceptedFiles.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            resolve(imageUrl);
          };
          reader.onerror = () => reject(new Error('Kunne ikke lese filen'));
          reader.readAsDataURL(file);
        });
      });
      
      const imageUrls = await Promise.all(imagePromises);
      
      setDetails(prev => ({
        ...prev,
        target_images: [...(prev.target_images || []), ...imageUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: true
  });

  const removeImage = (index: number) => {
    setDetails(prev => ({
      ...prev,
      target_images: prev.target_images?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = () => {
    const updatedEntry = {
      ...entry,
      details
    };
    
    // Save to localStorage
    try {
      const savedSessions = localStorage.getItem('trainingSessions');
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const updatedSessions = sessions.map((session: any) => 
          session.id === entry.id ? {
            ...session,
            details: details,
            training_type: details.training_type,
            results: details.results,
            notes: details.notes,
            target_images: details.target_images
          } : session
        );
        localStorage.setItem('trainingSessions', JSON.stringify(updatedSessions));
        localStorage.setItem('trainingLogLastUpdate', Date.now().toString());
      }
    } catch (error) {
      console.error('Error saving training details:', error);
    }
    
    onSave(updatedEntry);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Rediger treningsøkt</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('log.training_type')}
              </label>
              <select
                value={details.training_type || ''}
                onChange={(e) => setDetails(prev => ({ ...prev, training_type: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2"
              >
                <option value="">Velg type...</option>
                <option value="Pistol">Pistol</option>
                <option value="Revolver">Revolver</option>
                <option value="Rifle">Rifle</option>
                <option value="Luftpistol">Luftpistol</option>
                <option value="Luftrifle">Luftrifle</option>
                <option value="Dynamisk">Dynamisk</option>
                <option value="Feltskytting">Feltskytting</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resultater
              </label>
              <textarea
                value={details.results || ''}
                onChange={(e) => setDetails(prev => ({ ...prev, results: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-24"
                placeholder="Beskriv resultater, skår, eller prestasjoner..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notater
              </label>
              <textarea
                value={details.notes || ''}
                onChange={(e) => setDetails(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-gray-700 rounded-md px-3 py-2 h-32"
                placeholder="Notater om treningsøkten, teknikk, utstyr, etc..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Målbilder
              </label>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-400 bg-blue-400/10' : 'border-gray-600 hover:border-gray-500'
                } ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">
                  {isDragActive ? 'Slipp bildene her...' : 'Dra og slipp målbilder eller klikk for å velge'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, GIF - maks 5MB per bilde
                </p>
              </div>

              {details.target_images && details.target_images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {details.target_images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Målbilde ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button onClick={onClose} className="btn-secondary">
                Avbryt
              </button>
              <button onClick={handleSave} className="btn-primary">
                <Save className="w-4 h-4" />
                Lagre endringer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrainingLog() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [trainingSessions, setTrainingSessions] = useState<MemberTrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MemberTrainingSession | null>(null);
  const [organizationFilter, setOrganizationFilter] = useState<'all' | 'NSF' | 'DFS' | 'DSSN'>('all');
  const [activityFilter, setActivityFilter] = useState<'all' | 'Trening' | 'Stevne' | 'Dugnad'>('all');
  const [organizationSettings, setOrganizationSettings] = useState({
    nsf_enabled: true,
    dfs_enabled: true,
    dssn_enabled: true
  });
  const [availableActivities] = useState(['Trening', 'Stevne', 'Dugnad']);

  useEffect(() => {
    const loadTrainingSessions = async () => {
      if (!user?.id) return;
      
      try {
        const result = await getMemberTrainingSessions(user.id);
        if (result.error) {
          throw new Error(result.error);
        }

        setTrainingSessions(result.data || []);
      } catch (error) {
        console.error('Error loading training sessions:', error);
        setTrainingSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrainingSessions();

    // Refresh data every 30 seconds
    const interval = setInterval(loadTrainingSessions, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [user?.id]);

  // Calculate requirements
  const calculateRequirements = () => {
    const twoYearsAgo = subMonths(new Date(), 24);
    const recentSessions = trainingSessions.filter(session => {
      const sessionDate = safeDate(session.start_time);
      return sessionDate && isAfter(sessionDate, twoYearsAgo) && session.verified;
    });

    // Standard requirements (NSF/DFS)
    const standardSessions = recentSessions.filter(session =>
      !session.details?.training_type?.includes('Dynamisk')
    );

    // Dynamic requirements (DSSN)
    const dynamicTrainings = recentSessions.filter(session =>
      session.details?.training_type?.includes('Dynamisk') &&
      session.details?.training_type?.includes('trening')
    );
    
    const dynamicCompetitions = recentSessions.filter(session =>
      session.details?.training_type?.includes('Dynamisk') &&
      session.details?.training_type?.includes('stevne')
    );

    return {
      standard: {
        count: standardSessions.length,
        required: 10,
        met: standardSessions.length >= 10
      },
      dynamic: {
        trainings: {
          count: dynamicTrainings.length,
          required: 10,
          met: dynamicTrainings.length >= 10
        },
        competitions: {
          count: dynamicCompetitions.length,
          required: 10,
          met: dynamicCompetitions.length >= 10
        },
        overallMet: dynamicTrainings.length >= 10 && dynamicCompetitions.length >= 10
      }
    };
  };

  const requirements = calculateRequirements();

  const generatePDF = () => {
    // Filter sessions based on current filters
    let sessionsToExport = verifiedSessions;
    
    if (organizationFilter !== 'all') {
      sessionsToExport = sessionsToExport.filter(session => (session as any).organization === organizationFilter);
    }
    
    if (activityFilter !== 'all') {
      sessionsToExport = sessionsToExport.filter(session => (session as any).activity === activityFilter);
    }

    const doc = new jsPDF();
    
    // Add SVPK logo
    const SVPK_LOGO_URL = 'https://medlem.svpk.no/wp-content/uploads/2025/01/Logo-SVPK-orginal.png';
    
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
      doc.setFontSize(18);
      const titleSuffix = organizationFilter !== 'all' ? ` - ${organizationFilter}` : '';
      const activitySuffix = activityFilter !== 'all' ? ` (${activityFilter})` : '';
      doc.text(`TRENINGSLOGG${titleSuffix}${activitySuffix}`, 50, 18);

      // Add member info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Medlem: ${profile?.full_name || 'Ukjent'}`, 15, 35);
      doc.text(`Medlemsnummer: ${(profile as any)?.member_number || 'Ukjent'}`, 15, 42);
      doc.text(`Generert: ${format(new Date(), 'dd.MM.yyyy')}`, 15, 49);
      doc.text(`Filter: ${organizationFilter !== 'all' ? organizationFilter : 'Alle organisasjoner'}${activityFilter !== 'all' ? ` - ${activityFilter}` : ''}`, 15, 56);

      // Add requirements status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('KRAVSTATUS:', 15, 60);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Standard requirements
      doc.setTextColor(requirements.standard.met ? 0 : 255, requirements.standard.met ? 128 : 0, 0);
      doc.text(`Standard våpensøknad: ${requirements.standard.count}/10 treninger (${requirements.standard.met ? 'OPPFYLT' : 'IKKE OPPFYLT'})`, 15, 67);
      
      // Dynamic requirements
      doc.setTextColor(requirements.dynamic.overallMet ? 0 : 255, requirements.dynamic.overallMet ? 128 : 0, 0);
      doc.text(`Dynamisk våpensøknad: ${requirements.dynamic.trainings.count}/10 treninger, ${requirements.dynamic.competitions.count}/10 stevner (${requirements.dynamic.overallMet ? 'OPPFYLT' : 'IKKE OPPFYLT'})`, 15, 74);
      
      doc.setTextColor(0, 0, 0); // Reset to black

      // Table headers
      const headers = ['Dato', 'Aktivitet', 'Bane', 'Varighet', 'Verifisert av'];
      const columnWidths = [25, 35, 35, 25, 40];
      let startY = 85;
      let startX = 15;

      // Add header background
      doc.setFillColor(255, 215, 0); // SVPK yellow
      doc.rect(startX, startY - 5, columnWidths.reduce((a, b) => a + b, 0), 8, 'F');

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
      let yPos = startY + 8;

      const exportSessions = sessionsToExport;
      
      exportSessions.forEach((session, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 40;
          
          // Re-add headers on new page
          doc.setFillColor(255, 215, 0);
          doc.rect(15, yPos - 5, columnWidths.reduce((a, b) => a + b, 0), 8, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          let headerX = 15;
          headers.forEach((header, i) => {
            doc.text(header, headerX + 1, yPos);
            headerX += columnWidths[i];
          });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          yPos += 8;
        }

        // Add alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(15, yPos - 2, columnWidths.reduce((a, b) => a + b, 0), 5, 'F');
        }

        startX = 15;
        
        // Date
        doc.setTextColor(0, 0, 0);
        const sessionDate = safeDate((session as any).date) || safeDate(session.created_at) || new Date();
        doc.text(format(sessionDate, 'dd.MM.yyyy'), startX + 1, yPos);
        startX += columnWidths[0];
        
        // Activity - color code DSSN activities
        if ((session as any).organization === 'DSSN') {
          doc.setTextColor(74, 222, 128); // Green for DSSN
        } else if ((session as any).organization === 'DFS') {
          doc.setTextColor(20, 136, 252); // Blue for DFS
        } else {
          doc.setTextColor(0, 0, 0);
        }
        doc.text((session as any).activity || 'Trening', startX + 1, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black
        startX += columnWidths[1];
        
        // Location
        doc.text((session as any).location || 'Ukjent', startX + 1, yPos);
        startX += columnWidths[2];
        
        // Duration
        doc.text((session as any).duration || '1t', startX + 1, yPos);
        startX += columnWidths[3];
        
        // Verified by
        doc.setTextColor(0, 128, 0); // Green color
        doc.text((session as any).verifiedBy || session.verified_by || 'Verifisert', startX + 1, yPos);
        doc.setTextColor(0, 0, 0); // Reset to black

        yPos += 6;
      });

      // Add signature field at bottom
      yPos += 15;
      if (yPos > 240) {
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
      doc.text(`Generert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 140, yPos + 35);
      doc.text('Svolvær Pistolklubb - www.svpk.no', 140, yPos + 40);

      doc.save(`${profile?.full_name || 'medlem'}-treningslogg.pdf`);
    }
  };

  const generateExampleSessions = () => {
    return [];
  };

  // Load training sessions from localStorage
  useEffect(() => {
    const loadOrganizationSettings = () => {
      try {
        const savedOrg = localStorage.getItem('currentOrganization');
        if (savedOrg) {
          const orgData = JSON.parse(savedOrg);
          setOrganizationSettings(orgData);
        }
      } catch (error) {
        console.error('Error loading organization settings:', error);
      }
    };

    const loadSessions = async () => {
      try {
        const saved = localStorage.getItem('trainingSessions');
        let sessions: TrainingEntry[] = [];
        
        if (saved) {
          const parsed = JSON.parse(saved);
          sessions = parsed.map((session: any) => ({
            id: session.id,
            date: new Date(session.date),
            location: session.location || session.rangeName || 'Ukjent',
            duration: session.duration || '2 timer',
            verified: session.verified || session.approved || false,
            verifiedBy: session.verifiedBy || session.rangeOfficer,
            activity: session.activity || 'Trening',
            organization: session.organization || (session.activity?.includes('Dynamisk') ? 'DSSN' : 'NSF'),
            details: session.details || {
              training_type: session.training_type,
              results: session.results,
              notes: session.notes,
              target_images: session.target_images || []
            }
          }));
        }
        
        // Add example sessions for demo
        const exampleSessions = generateExampleSessions();
        const allSessions = [...sessions, ...exampleSessions] as any[];
        setTrainingSessions(allSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        setTrainingSessions(generateExampleSessions());
      } finally {
        setLoading(false);
      }
    };

    loadOrganizationSettings();
    loadSessions();

    // Listen for updates
    const handleUpdate = () => {
      loadOrganizationSettings();
      loadSessions();
    };
    
    window.addEventListener('trainingDataUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    
    // Also check for localStorage updates
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem('trainingLogLastUpdate');
      if (lastUpdate) {
        handleUpdate();
        localStorage.removeItem('trainingLogLastUpdate');
      }
    }, 500);

    return () => {
      window.removeEventListener('trainingDataUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleEditEntry = (entry: MemberTrainingSession) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async (updatedEntry: MemberTrainingSession & { details?: TrainingDetails }) => {
    try {
      if (updatedEntry.details) {
        await updateTrainingDetails(updatedEntry.id, updatedEntry.details);
      }
      
      // Refresh sessions from database
      if (user?.id) {
        const result = await getMemberTrainingSessions(user.id);
        if (result.data) {
          setTrainingSessions(result.data);
        }
      }
    } catch (error) {
      console.error('Error saving training details:', error);
    }
    setEditingEntry(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Laster treningslogg...</p>
        </div>
      </div>
    );
  }

  const verifiedSessions = trainingSessions.filter(session => session.verified);
  
  // Apply filters
  let filteredSessions = verifiedSessions.filter(session => {
    const trainingType = session.details?.training_type || 'Trening';
    const matchesOrg = organizationFilter === 'all' || 
      (organizationFilter === 'DSSN' && trainingType.includes('Dynamisk')) ||
      (organizationFilter === 'NSF' && !trainingType.includes('Dynamisk')) ||
      (organizationFilter === 'DFS' && trainingType.includes('Felt'));
    const matchesActivity = activityFilter === 'all' || trainingType.includes(activityFilter);
    return matchesOrg && matchesActivity;
  });
  
  // Apply sorting - always newest first
  filteredSessions = filteredSessions.sort((a, b) => {
    const aDate = safeDate(b.start_time);
    const bDate = safeDate(a.start_time);
    if (!aDate || !bDate) return 0;
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-svpk-yellow mb-4">
          {t('log.title')}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {t('log.description')}
        </p>
      </header>

      {/* Filtering Controls */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('log.filter_title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('log.organization')}
            </label>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value as 'all' | 'NSF' | 'DFS' | 'DSSN')}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="all">{t('log.all_organizations')}</option>
              <option value="NSF">NSF - Sportsskyting</option>
              <option value="DFS">DFS - Feltskytting</option>
              <option value="DSSN">DSSN - Dynamisk</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('log.activity_type')}
            </label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as any)}
              className="w-full bg-gray-700 rounded-lg px-4 py-2"
            >
              <option value="all">{t('log.all_activities')}</option>
              {availableActivities.map((activity: string) => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
          </div>
          
        </div>
        
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-400">
            {t('log.showing', { filtered: filteredSessions.length, total: verifiedSessions.length })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="btn-secondary"
            >
              <Plus className="w-5 h-5" />
              Manuell registrering
            </button>
            <button
              onClick={generatePDF}
              className="btn-primary"
            >
              <Download className="w-5 h-5" />
              {t('log.download_filtered_pdf')}
            </button>
          </div>
        </div>
      </div>
      {/* Requirements Status - Dynamic Grid based on enabled disciplines */}
      <div className={`grid gap-6 ${
        [organizationSettings.nsf_enabled, organizationSettings.dfs_enabled, organizationSettings.dssn_enabled].filter(Boolean).length === 1 
          ? 'grid-cols-1 max-w-md mx-auto'
          : [organizationSettings.nsf_enabled, organizationSettings.dfs_enabled, organizationSettings.dssn_enabled].filter(Boolean).length === 2
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 lg:grid-cols-3'
      }`}>
        {/* NSF Requirements Ring */}
        {organizationSettings.nsf_enabled && (
        <div className="card">
          <div className="flex flex-col items-center p-6">
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#FFD700"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(requirements.standard.count / requirements.standard.required) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-svpk-yellow">
                  {requirements.standard.count}
                </span>
                <span className="text-sm text-gray-400">av 10</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{t('log.nsf_training_weapons')}</h3>
            <p className="text-gray-400 text-center mb-4">
              {t('log.nsf_requirement_text')}
            </p>
            
            {requirements.standard.met ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
                <span className="text-green-400 font-semibold">✅ {t('log.fulfilled')}</span>
              </div>
            ) : (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
                <span className="text-red-400 font-semibold">
                  {t('log.trainings_remaining', { count: requirements.standard.required - requirements.standard.count })}
                </span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* DFS Requirements Ring */}
        {organizationSettings.dfs_enabled && (
        <div className="card">
          <div className="flex flex-col items-center p-6">
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#a855f7"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(requirements.standard.count / requirements.standard.required) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-purple-400">
                  {requirements.standard.count}
                </span>
                <span className="text-sm text-gray-400">av 10</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{t('log.dfs_field_shooting')}</h3>
            <p className="text-gray-400 text-center mb-4">
              {t('log.dfs_requirement_text')}
            </p>
            
            {requirements.standard.met ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
                <span className="text-green-400 font-semibold">✅ {t('log.fulfilled')}</span>
              </div>
            ) : (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2">
                <span className="text-red-400 font-semibold">
                  {t('log.trainings_remaining', { count: requirements.standard.required - requirements.standard.count })}
                </span>
              </div>
            )}
          </div>
        </div>
        )}

        {/* DSSN Dynamic Requirements Ring */}
        {organizationSettings.dssn_enabled && (
        <div className="card">
          <div className="flex flex-col items-center p-6">
            <div className="relative w-32 h-32 mb-6">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#374151"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#4ade80"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${((requirements.dynamic.trainings.count + requirements.dynamic.competitions.count) / 20) * 314} 314`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-green-400">
                  {requirements.dynamic.trainings.count + requirements.dynamic.competitions.count}
                </span>
                <span className="text-sm text-gray-400">av 20</span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-2">{t('log.dynamic_weapon_application')}</h3>
            <p className="text-gray-400 text-center mb-4">
              {t('log.dssn_requirement_text')}
            </p>
            
            <div className="space-y-2 text-sm text-center mb-4">
              <div className="flex justify-between items-center">
                <span>{t('log.trainings_colon')}</span>
                <span className={requirements.dynamic.trainings.met ? 'text-green-400' : 'text-gray-400'}>
                  {requirements.dynamic.trainings.count}/10
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t('log.open_competitions_colon')}</span>
                <span className={requirements.dynamic.competitions.met ? 'text-green-400' : 'text-gray-400'}>
                  {requirements.dynamic.competitions.count}/10
                </span>
              </div>
            </div>
            
            {requirements.dynamic.overallMet ? (
              <div className="bg-green-900/30 border border-green-700 rounded-lg px-4 py-2">
                <span className="text-green-400 font-semibold">✅ {t('log.fulfilled')}</span>
              </div>
            ) : (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-2 text-center">
                <div className="text-red-400 font-semibold text-xs">
                  {!requirements.dynamic.trainings.met && (
                    <div>{t('log.trainings_remaining', { count: 10 - requirements.dynamic.trainings.count })}</div>
                  )}
                  {!requirements.dynamic.competitions.met && (
                    <div>{t('log.competitions_remaining', { count: 10 - requirements.dynamic.competitions.count })}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Training Sessions List */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{t('log.your_sessions')}</h2>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {verifiedSessions.length === 0 
                ? t('log.no_sessions')
                : t('log.no_filtered_sessions')
              }
            </p>
            <p className="text-sm text-gray-500">
              {verifiedSessions.length === 0 
                ? t('log.scan_first')
                : t('log.change_filters')
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => {
              // Determine color based on organization
              let orgColor = '#FFD700'; // SVPK yellow for NSF
              let orgBgColor = 'bg-yellow-500/20';
              let orgBorderColor = 'border-yellow-500/30';
              let orgTagStyle = 'bg-black text-yellow-400'; // NSF gets black background for better visibility
              
              if ((session as any).organization === 'DFS') {
                orgColor = '#1488FC';
                orgBgColor = 'bg-blue-500/20';
                orgBorderColor = 'border-blue-500/30';
                orgTagStyle = 'bg-blue-500/20 text-blue-400';
              } else if ((session as any).organization === 'DSSN') {
                orgColor = '#4ade80';
                orgBgColor = 'bg-green-500/20';
                orgBorderColor = 'border-green-500/30';
                orgTagStyle = 'bg-green-500/20 text-green-400';
              }
              
              return (
              <div
                key={session.id} 
                className={`p-4 rounded-lg border ${orgBgColor} ${orgBorderColor}`}
                onDoubleClick={() => handleEditEntry(session)}
                style={{ cursor: 'pointer' }}
                title="Dobbeltklikk for å redigere"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-svpk-yellow" />
                      <span className="font-medium">
                        {safeDate((session as any).date) ? format(safeDate((session as any).date)!, 'dd.MM.yyyy') : 
                         safeDate(session.created_at) ? format(safeDate(session.created_at)!, 'dd.MM.yyyy') : 'Ukjent dato'}
                      </span>
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium ${orgBgColor} ${orgBorderColor}`}
                        style={{ color: orgColor }}
                      >
                        {(session as any).activity || 'Trening'}
                      </span>
                      <span 
                        className={`px-2 py-1 rounded text-xs font-medium border ${orgTagStyle}`}
                      >
                        {(session as any).organization || 'NSF'}
                      </span>
                    </div>
                    <div className="text-gray-300 space-y-1">
                      <p><strong>{t('log.range')}</strong> {(session as any).location || 'Ukjent'}</p>
                      <p><strong>{t('log.duration')}</strong> {(session as any).duration || '1t'}</p>
                      {((session as any).verifiedBy || session.verified_by) && (
                        <p><strong>{t('log.verified_by')}</strong> {(session as any).verifiedBy || session.verified_by}</p>
                      )}
                      {session.details?.training_type && (
                        <p><strong>{t('log.type')}</strong> {session.details.training_type}</p>
                      )}
                      {session.details?.results && (
                        <p><strong>{t('log.results')}</strong> {session.details.results}</p>
                      )}
                      {(session.details as any)?.target_images && (session.details as any).target_images.length > 0 && (
                        <p><strong>{t('log.target_images')}</strong> {(session.details as any).target_images.length} {t('log.images')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-col">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">{t('log.verified')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEntry(session);
                      }}
                      className="text-gray-400 hover:text-white p-1"
                      title={t('log.edit_session')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Manual Training Modal */}
      {showManualModal && (
        <ManualTrainingModal
          onClose={() => setShowManualModal(false)}
          onSuccess={() => {
            setShowManualModal(false);
            // Refresh training sessions
            const handleUpdate = () => {
              const saved = localStorage.getItem('trainingSessions');
              if (saved) {
                const parsed = JSON.parse(saved);
                const sessions = parsed.map((session: any) => ({
                  id: session.id,
                  date: new Date(session.date),
                  location: session.location || session.rangeName || 'Ukjent',
                  duration: session.duration || '2 timer',
                  verified: session.verified || session.approved || false,
                  verifiedBy: session.verifiedBy || session.rangeOfficer,
                  activity: session.activity || 'Trening',
                  organization: session.organization || (session.activity?.includes('Dynamisk') ? 'DSSN' : 'NSF')
                }));
                
                const exampleSessions = generateExampleSessions();
                const allSessions = [...sessions, ...exampleSessions];
                setTrainingSessions(allSessions);
              }
            };
            handleUpdate();
          }}
        />
      )}

      {/* Edit Training Modal */}
      {editingEntry && (
        <EditTrainingModal
          entry={editingEntry as any}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEdit as any}
        />
      )}

      {/* Info Section */}
      <div className={`grid gap-6 ${
        [organizationSettings.nsf_enabled, organizationSettings.dfs_enabled, organizationSettings.dssn_enabled].filter(Boolean).length === 1 
          ? 'grid-cols-1 max-w-md mx-auto'
          : [organizationSettings.nsf_enabled, organizationSettings.dfs_enabled, organizationSettings.dssn_enabled].filter(Boolean).length === 2
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1 lg:grid-cols-3'
      }`}>
        {/* NSF Info Box */}
        {organizationSettings.nsf_enabled && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
          <h3 className="font-semibold text-blue-400 mb-3">📋 {t('log.nsf_info_title')}</h3>
          <div className="space-y-3 text-sm text-blue-200">
            <div>
              <p className="font-medium">{t('log.nsf_info_requirement')}</p>
              <p>{t('log.nsf_info_10_trainings')}</p>
              <p>{t('log.nsf_info_all_types')}</p>
              <p>{t('log.nsf_info_weapons')}</p>
              <p>{t('log.nsf_info_documented')}</p>
            </div>
          </div>
        </div>
        )}

        {/* DFS Info Box */}
        {organizationSettings.dfs_enabled && (
        <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
          <h3 className="font-semibold text-purple-400 mb-3">🎯 {t('log.dfs_info_title')}</h3>
          <div className="space-y-3 text-sm text-purple-200">
            <div>
              <p className="font-medium">{t('log.dfs_info_requirement')}</p>
              <p>{t('log.dfs_info_10_trainings')}</p>
              <p>{t('log.dfs_info_field_hunting')}</p>
              <p>{t('log.dfs_info_weapons')}</p>
              <p>{t('log.dfs_info_documented')}</p>
            </div>
          </div>
        </div>
        )}

        {/* DSSN Info Box */}
        {organizationSettings.dssn_enabled && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
          <h3 className="font-semibold text-green-400 mb-3">⚡ {t('log.dssn_info_title')}</h3>
          <div className="space-y-3 text-sm text-green-200">
            <div>
              <p className="font-medium">{t('log.dssn_info_requirement')}</p>
              <p>{t('log.dssn_info_weapons')}</p>
              <p>{t('log.dssn_info_same_rules')}</p>
              <p>• <strong>{t('log.dssn_info_rifle_exception')}</strong></p>
              <p>{t('log.dssn_info_activity_requirement')}</p>
              <p>• <span className="text-green-400">{t('log.dssn_info_green_activities')}</span></p>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}