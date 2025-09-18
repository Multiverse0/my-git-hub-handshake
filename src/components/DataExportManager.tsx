import { useState } from 'react';
import { Package, AlertTriangle, CheckCircle, Loader2, FileText, Database, Archive } from 'lucide-react';
import { format } from 'date-fns';
import JSZip from 'jszip';
import { supabase, setUserContext } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DataExportManagerProps {
  organizationId: string;
  organizationName: string;
  onClose: () => void;
}

interface ExportData {
  organization: any;
  members: any[];
  trainingSessions: any[];
  trainingLocations: any[];
  settings: any[];
  admins: any[];
}

export function DataExportManager({ organizationId, organizationName, onClose }: DataExportManagerProps) {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportStats, setExportStats] = useState<{
    members: number;
    sessions: number;
    locations: number;
    settings: number;
    admins: number;
  } | null>(null);

  const gatherOrganizationData = async (): Promise<ExportData> => {
    try {
      // Ensure user context is set for RLS policies
      if (user?.email) {
        await setUserContext(user.email);
      }

      // Get organization data from Supabase
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      }

      // Get members for this organization
      const { data: orgMembers, error: membersError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', organizationId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
      }

      // Get training sessions for this organization
      const { data: orgSessions, error: sessionsError } = await supabase
        .from('member_training_sessions')
        .select(`
          *,
          organization_members (*),
          training_locations (*),
          training_session_details (*),
          session_target_images (*)
        `)
        .eq('organization_id', organizationId);

      if (sessionsError) {
        console.error('Error fetching training sessions:', sessionsError);
      }

      // Get training locations for this organization
      const { data: trainingLocations, error: locationsError } = await supabase
        .from('training_locations')
        .select('*')
        .eq('organization_id', organizationId);

      if (locationsError) {
        console.error('Error fetching training locations:', locationsError);
      }

      // Get organization settings
      const { data: orgSettings, error: settingsError } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId);

      if (settingsError) {
        console.error('Error fetching organization settings:', settingsError);
      }

      // Get organization admins
      const orgAdmins = (orgMembers || []).filter((member: any) => member.role === 'admin');

      return {
        organization: organization || {},
        members: orgMembers || [],
        trainingSessions: orgSessions || [],
        trainingLocations: trainingLocations || [],
        settings: orgSettings || [],
        admins: orgAdmins
      };
    } catch (error) {
      console.error('Error gathering organization data:', error);
      throw new Error('Kunne ikke samle organisasjonsdata fra database');
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special characters and commas in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  };

  const createCustomerExportZip = async (data: ExportData): Promise<Blob> => {
    const zip = new JSZip();

    // Add README file for customer
    const readmeContent = `AKTIVLOGG Data Export - ${organizationName}
Eksportert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}

Denne pakken inneholder alle dine data fra AKTIVLOGG-systemet i standard formater som kan importeres i andre systemer.

FILER INKLUDERT:
- medlemmer.csv: Alle medlemmer med kontaktinformasjon og status
- treningsokter.csv: Alle registrerte treningsøkter med detaljer
- standplassledere.csv: Liste over standplassledere og deres informasjon
- skytebaner.csv: Konfigurasjon av skytebaner og QR-koder
- organisasjon.csv: Organisasjonsinformasjon og innstillinger

DATAFORMAT:
Alle filer er i CSV-format (kommaseparerte verdier) som kan åpnes i:
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Eller importeres i andre medlemssystemer

PERSONVERN:
Disse dataene inneholder personopplysninger. Vennligst håndter dem i henhold til GDPR-kravene.

For spørsmål om dataene, kontakt: yngve@promonorge.no
`;

    zip.file('README.txt', readmeContent);

    // Export members
    if (data.members.length > 0) {
      const membersCSV = convertToCSV(data.members.map(member => ({
        'Navn': member.full_name || member.fullName,
        'E-post': member.email,
        'Medlemsnummer': member.member_number || member.memberNumber,
        'Rolle': member.role,
        'Godkjent': member.approved ? 'Ja' : 'Nei',
        'Aktiv': member.active ? 'Ja' : 'Nei',
        'Registrert_dato': member.created_at || member.registrationDate,
        'Telefon': member.phone || '',
        'Adresse': member.address || ''
      })));
      zip.file('medlemmer.csv', membersCSV);
    }

    // Export training sessions
    if (data.trainingSessions.length > 0) {
      const sessionsCSV = convertToCSV(data.trainingSessions.map(session => ({
        'Dato': format(new Date(session.date || session.start_time), 'dd.MM.yyyy'),
        'Tid': format(new Date(session.date || session.start_time), 'HH:mm'),
        'Medlem': session.memberName || session.member?.full_name,
        'Medlemsnummer': session.memberNumber || session.member?.member_number,
        'Skytebane': session.location || session.rangeName,
        'Aktivitet': session.activity || 'Trening',
        'Varighet': '2 timer',
        'Godkjent': session.approved || session.verified ? 'Ja' : 'Nei',
        'Godkjent_av': session.verifiedBy || session.rangeOfficer || '',
        'Notater': session.notes || ''
      })));
      zip.file('treningsokter.csv', sessionsCSV);
    }

    // Export range officers/admins
    if (data.admins.length > 0) {
      const adminsCSV = convertToCSV(data.admins.map(admin => ({
        'Navn': admin.full_name || admin.fullName,
        'E-post': admin.email,
        'Rolle': admin.role,
        'Aktiv': admin.active ? 'Ja' : 'Nei',
        'Opprettet': admin.created_at || admin.addedDate
      })));
      zip.file('standplassledere.csv', adminsCSV);
    }

    // Export training locations
    if (data.trainingLocations.length > 0) {
      const locationsCSV = convertToCSV(data.trainingLocations.map(location => ({
        'Navn': location.name,
        'QR_kode': location.qr_code_id,
        'Beskrivelse': location.description || '',
        'Aktiv': location.active !== false ? 'Ja' : 'Nei'
      })));
      zip.file('skytebaner.csv', locationsCSV);
    }

    // Export organization info
    if (data.organization) {
      const orgCSV = convertToCSV([{
        'Navn': data.organization.name,
        'Beskrivelse': data.organization.description || '',
        'E-post': data.organization.email || '',
        'Telefon': data.organization.phone || '',
        'Nettside': data.organization.website || '',
        'Adresse': data.organization.address || '',
        'Primaerfarge': data.organization.primary_color,
        'Sekundaerfarge': data.organization.secondary_color,
        'Opprettet': data.organization.created_at
      }]);
      zip.file('organisasjon.csv', orgCSV);
    }

    return await zip.generateAsync({ type: 'blob' });
  };

  const createSystemBackupZip = async (data: ExportData): Promise<Blob> => {
    const zip = new JSZip();

    // Add system restore instructions
    const restoreInstructions = `AKTIVLOGG System Backup - ${organizationName}
Eksportert: ${format(new Date(), 'dd.MM.yyyy HH:mm')}
Organisasjons-ID: ${organizationId}

GJENOPPRETTINGSINSTRUKSJONER:
Denne pakken inneholder alle data i AKTIVLOGG's interne format for gjenoppretting.

FILER:
- organization.json: Organisasjonsdata og innstillinger
- members.json: Alle medlemmer med krypterte passord
- training_sessions.json: Alle treningsøkter med metadata
- training_locations.json: Skytebaner og QR-kode konfigurasjon
- settings.json: Organisasjonsinnstillinger og preferanser

GJENOPPRETTING:
1. Opprett ny organisasjon i AKTIVLOGG admin-panel
2. Importer organization.json først
3. Importer members.json (passord må tilbakestilles)
4. Importer training_locations.json
5. Importer training_sessions.json
6. Importer settings.json sist

SIKKERHET:
- Passord er hashet med bcrypt
- Persondata er inkludert - håndter i henhold til GDPR
- Kun for AKTIVLOGG system-administratorer

Kontakt: yngve@promonorge.no for gjenopprettingshjelp
`;

    zip.file('RESTORE_INSTRUCTIONS.txt', restoreInstructions);

    // Add raw JSON data for system restore
    zip.file('organization.json', JSON.stringify(data.organization, null, 2));
    zip.file('members.json', JSON.stringify(data.members, null, 2));
    zip.file('training_sessions.json', JSON.stringify(data.trainingSessions, null, 2));
    zip.file('training_locations.json', JSON.stringify(data.trainingLocations, null, 2));
    zip.file('settings.json', JSON.stringify(data.settings, null, 2));

    // Add metadata
    const metadata = {
      export_date: new Date().toISOString(),
      organization_id: organizationId,
      organization_name: organizationName,
      export_version: '1.0',
      system: 'AKTIVLOGG',
      data_counts: {
        members: data.members.length,
        training_sessions: data.trainingSessions.length,
        training_locations: data.trainingLocations.length,
        settings: data.settings.length,
        admins: data.admins.length
      }
    };
    zip.file('export_metadata.json', JSON.stringify(metadata, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      // Gather all organization data
      const data = await gatherOrganizationData();
      
      // Set export statistics
      setExportStats({
        members: data.members.length,
        sessions: data.trainingSessions.length,
        locations: data.trainingLocations.length,
        settings: data.settings.length,
        admins: data.admins.length
      });

      // Create customer export (CSV files)
      const customerZip = await createCustomerExportZip(data);
      const customerFilename = `${organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_data_export_${format(new Date(), 'yyyy-MM-dd')}.zip`;
      
      // Create system backup (JSON files)
      const systemZip = await createSystemBackupZip(data);
      const systemFilename = `${organizationName.replace(/[^a-zA-Z0-9]/g, '_')}_system_backup_${format(new Date(), 'yyyy-MM-dd')}.zip`;

      // Download customer export
      const customerUrl = URL.createObjectURL(customerZip);
      const customerLink = document.createElement('a');
      customerLink.href = customerUrl;
      customerLink.download = customerFilename;
      document.body.appendChild(customerLink);
      customerLink.click();
      document.body.removeChild(customerLink);
      URL.revokeObjectURL(customerUrl);

      // Download system backup after a short delay
      setTimeout(() => {
        const systemUrl = URL.createObjectURL(systemZip);
        const systemLink = document.createElement('a');
        systemLink.href = systemUrl;
        systemLink.download = systemFilename;
        document.body.appendChild(systemLink);
        systemLink.click();
        document.body.removeChild(systemLink);
        URL.revokeObjectURL(systemUrl);
      }, 1000);

      setExportComplete(true);

    } catch (error) {
      console.error('Error exporting data:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke eksportere data');
    } finally {
      setIsExporting(false);
    }
  };

  if (exportComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
          <div className="p-6">
            <div className="text-center">
              <div className="bg-green-500/10 text-green-400 p-4 rounded-full inline-flex mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-green-400">Eksport Fullført!</h3>
              
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-4">📦 To filer er lastet ned:</h4>
                <div className="space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-blue-400">Kunde-eksport (CSV)</p>
                      <p className="text-sm text-gray-300">
                        Standard CSV-filer som kunden kan bruke i andre systemer
                      </p>
                      <p className="text-xs text-gray-400">
                        Inneholder: medlemmer.csv, treningsokter.csv, standplassledere.csv, etc.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-purple-400">System-backup (JSON)</p>
                      <p className="text-sm text-gray-300">
                        Komplett backup for gjenoppretting i AKTIVLOGG
                      </p>
                      <p className="text-xs text-gray-400">
                        Inneholder: organization.json, members.json, training_sessions.json, etc.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {exportStats && (
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-medium mb-3">📊 Eksporterte data:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Medlemmer: <span className="font-bold text-blue-400">{exportStats.members}</span></div>
                    <div>Treningsøkter: <span className="font-bold text-green-400">{exportStats.sessions}</span></div>
                    <div>Skytebaner: <span className="font-bold text-yellow-400">{exportStats.locations}</span></div>
                    <div>Administratorer: <span className="font-bold text-purple-400">{exportStats.admins}</span></div>
                  </div>
                </div>
              )}

              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-medium text-orange-400 mb-2">Viktige instruksjoner:</p>
                    <ul className="text-sm text-orange-200 space-y-1">
                      <li>• Send kunde-eksporten til organisasjonen</li>
                      <li>• Lagre system-backupen sikkert for eventuelle gjenopprettinger</li>
                      <li>• Organisasjonen kan nå slettes fra systemet</li>
                      <li>• Begge filer inneholder persondata - håndter i henhold til GDPR</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button onClick={onClose} className="btn-primary">
                Lukk og fortsett med sletting
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-red-500/10 text-red-400 p-4 rounded-full inline-flex mb-4">
              <Package className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Eksporter Organisasjonsdata</h3>
            <p className="text-gray-300">
              Eksporter alle data for <strong>{organizationName}</strong> før sletting
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-red-400 mb-2">⚠️ Viktig informasjon</h4>
                <ul className="text-sm text-red-200 space-y-1">
                  <li>• Dette vil eksportere ALLE data for organisasjonen</li>
                  <li>• To separate filer vil bli generert og lastet ned</li>
                  <li>• Prosessen kan ikke angres etter at organisasjonen er slettet</li>
                  <li>• Sørg for at begge filer er lastet ned før du sletter organisasjonen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <h4 className="font-semibold text-blue-400">Kunde-eksport (CSV)</h4>
              </div>
              <p className="text-sm text-blue-200 mb-2">
                Standard CSV-filer som organisasjonen kan bruke i andre systemer:
              </p>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• medlemmer.csv - Alle medlemmer med kontaktinfo</li>
                <li>• treningsokter.csv - Alle treningsøkter med detaljer</li>
                <li>• standplassledere.csv - Administratorer og standplassledere</li>
                <li>• skytebaner.csv - Skytebaner og QR-kode konfigurasjon</li>
                <li>• organisasjon.csv - Organisasjonsinformasjon</li>
              </ul>
            </div>

            <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-purple-400" />
                <h4 className="font-semibold text-purple-400">System-backup (JSON)</h4>
              </div>
              <p className="text-sm text-purple-200 mb-2">
                Komplett backup i AKTIVLOGG's interne format for gjenoppretting:
              </p>
              <ul className="text-xs text-purple-200 space-y-1">
                <li>• organization.json - Komplett organisasjonsdata</li>
                <li>• members.json - Medlemmer med hashede passord</li>
                <li>• training_sessions.json - Treningsøkter med metadata</li>
                <li>• training_locations.json - Skytebaner med full konfigurasjon</li>
                <li>• settings.json - Alle organisasjonsinnstillinger</li>
              </ul>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200 mb-6">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isExporting}
            >
              Avbryt
            </button>
            <button
              onClick={handleExport}
              className="btn-primary"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Eksporterer data...
                </>
              ) : (
                <>
                  <Archive className="w-5 h-5" />
                  Start dataeksport
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}