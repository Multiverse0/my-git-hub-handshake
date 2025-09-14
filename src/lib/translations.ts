// Translation system for AKTIVLOGG
export interface TranslationKey {
  [key: string]: string;
}

export interface Translations {
  [language: string]: TranslationKey;
}

// Translation keys and Norwegian base text
export const translations: Translations = {
  no: {
    // Navigation
    'nav.home': 'Hjem',
    'nav.scanner': 'Skann',
    'nav.log': 'Logg',
    'nav.profile': 'Profil',
    'nav.admin': 'Admin',
    'nav.logout': 'Logg ut',
    
    // Home page
    'home.welcome': 'Velkommen til {name}s Treningslogg',
    'home.description': 'Registrer dine treningstimer enkelt og sikkert. Skann QR-koden på skytebanen for å starte økten.',
    'home.scan_qr': 'Skann QR',
    'home.scan_description': 'Start økten ved å skanne QR-koden på skytebanen',
    'home.start_scanning': 'Start Skanning',
    'home.view_log': 'Se Logg',
    'home.view_log_description': 'Se oversikt over dine gjennomførte treningsøkter',
    'home.show_log': 'Vis Logg',
    'home.download_pdf': 'Last ned PDF',
    'home.download_description': 'Last ned treningsloggen som PDF når du har 10 økter',
    'home.download': 'Last ned',
    
    // Scanner page
    'scanner.title': 'Skann QR-kode',
    'scanner.description': 'Skann QR-koden på skytebanen for å registrere oppmøte på trening',
    'scanner.start_scanning': 'Start Skanning',
    'scanner.start_camera': 'Start Kamera',
    'scanner.cancel_scanning': 'Avbryt skanning',
    'scanner.already_registered': 'ALLEREDE REGISTRERT!',
    'scanner.calm_down': 'Rolig an der, ivrig skytter! 😄',
    'scanner.already_today': 'Du har allerede registrert trening i dag',
    'scanner.one_per_day': 'Én trening per dag er nok for å holde seg i form! 🎯',
    'scanner.come_back_tomorrow': 'Kom tilbake i morgen for å registrere ny trening!',
    'scanner.understand': 'Skjønner! 👍',
    'scanner.registered': 'REGISTRERT!',
    'scanner.training_registered': 'Trening Registrert!',
    'scanner.member': 'Medlem:',
    'scanner.date': 'Dato:',
    'scanner.time': 'Tid:',
    'scanner.waiting_approval': 'Din treningsøkt er nå registrert og venter på godkjenning fra skyteleder!',
    'scanner.redirecting': 'Du blir automatisk sendt til treningsloggen om 5 sekunder...',
    'scanner.go_to_log': 'Gå til Treningslogg',
    
    // Training Log
    'log.title': 'Treningslogg',
    'log.description': 'Oversikt over dine registrerte treningsøkter og kravstatus for våpensøknader',
    'log.filter_title': 'Filtrer treningsøkter',
    'log.organization': 'Organisasjon/Gren',
    'log.all_organizations': 'Alle organisasjoner',
    'log.activity_type': 'Aktivitetstype',
    'log.all_activities': 'Alle aktiviteter',
    'log.showing': 'Viser {filtered} av {total} treningsøkter',
    'log.download_filtered_pdf': 'Last ned filtrert PDF',
    'log.nsf_training_weapon': 'NSF Treningsvåpen',
    'log.nsf_requirement': 'Krav: 10 treninger siste 24 måneder (NSF)',
    'log.dfs_field_shooting': 'DFS Feltskytting',
    'log.dfs_requirement': 'Krav: 10 treninger siste 24 måneder (DFS)',
    'log.dssn_dynamic': 'DSSN Dynamisk',
    'log.dssn_requirement': 'Krav: 10 treninger + 10 åpne stevner (DSSN)',
    'log.fulfilled': 'OPPFYLT',
    'log.trainings_left': '{count} treninger igjen',
    'log.competitions_left': '{count} stevner igjen',
    'log.your_sessions': 'Dine Treningsøkter',
    'log.nsf_training_weapons': 'NSF Treningsvåpen',
    'log.nsf_requirement_text': 'Krav: 10 treninger siste 24 måneder (NSF)',
    'log.dfs_field_shooting': 'DFS Feltskytting', 
    'log.dfs_requirement_text': 'Krav: 10 treninger siste 24 måneder (DFS)',
    'log.dynamic_weapon_application': 'Dynamisk Våpensøknad',
    'log.dssn_requirement_text': 'Krav: 10 treninger + 10 åpne stevner (DSSN)',
    'log.trainings_colon': 'Treninger:',
    'log.open_competitions_colon': 'Åpne stevner:',
    'log.trainings_remaining': '{count} treninger igjen',
    'log.competitions_remaining': '{count} stevner igjen',
    'log.nsf_info_title': 'NSF - Treningsvåpen',
    'log.nsf_info_requirement': 'Krav for treningsvåpen (NSF):',
    'log.nsf_info_10_trainings': '• Minst 10 treninger siste 24 måneder',
    'log.nsf_info_all_types': '• Alle typer treningsaktiviteter teller',
    'log.nsf_info_weapons': '• Gjelder pistol, revolver og rifle',
    'log.nsf_info_documented': '• Dokumentert aktivitet i godkjent skytterklubb',
    'log.dfs_info_title': 'DFS - Feltskytting',
    'log.dfs_info_requirement': 'Krav for feltskytting (DFS):',
    'log.dfs_info_10_trainings': '• Minst 10 treninger siste 24 måneder',
    'log.dfs_info_field_hunting': '• Feltskytting og jaktrelaterte aktiviteter',
    'log.dfs_info_weapons': '• Gjelder rifle og hagle',
    'log.dfs_info_documented': '• Dokumentert aktivitet i godkjent skytterklubb',
    'log.dssn_info_title': 'DSSN - Dynamisk',
    'log.dssn_info_requirement': 'Krav for dynamisk skyting (DSSN):',
    'log.dssn_info_weapons': '• Våpen kan anskaffes gjennom DSSN og deres skyteprogrammer',
    'log.dssn_info_same_rules': '• Samme regler som andre skytterorganisasjoner',
    'log.dssn_info_rifle_exception': 'Unntak for rifle: 24 måneders karantenetid etter bestått godkjenningskurs',
    'log.dssn_info_activity_requirement': '• Aktivitetskrav i tillegg til karantenetid',
    'log.dssn_info_green_activities': 'Grønne aktiviteter teller for dynamisk skyting',
    'log.no_sessions': 'Ingen verifiserte treningsøkter ennå',
    'log.no_filtered_sessions': 'Ingen treningsøkter matcher de valgte filtrene',
    'log.scan_first': 'Skann QR-koden på skytebanen for å registrere din første økt',
    'log.change_filters': 'Prøv å endre filtrene for å se flere treningsøkter',
    'log.range': 'Bane:',
    'log.duration': 'Varighet:',
    'log.verified_by': 'Verifisert av:',
    'log.type': 'Type:',
    'log.results': 'Resultater:',
    'log.target_images': 'Målbilder:',
    'log.images': 'bilde(r)',
    'log.edit_session': 'Rediger treningsøkt',
    'log.dssn_info_title': 'DSSN - Dynamisk',
    'log.dssn_info_requirement': 'Krav for dynamisk skyting (DSSN):',
    'log.dssn_info_weapons': '• Våpen kan anskaffes gjennom DSSN og deres skyteprogrammer',
    'log.dssn_info_same_rules': '• Samme regler som andre skytterorganisasjoner',
    'log.dssn_info_rifle_exception': '• Unntak for rifle: 24 måneders karantenetid etter bestått godkjenningskurs',
    'log.dssn_info_activity_requirement': '• Aktivitetskrav i tillegg til karantenetid',
    'log.dssn_info_green_activities': '• Grønne aktiviteter teller for dynamisk skyting',
    'log.no_sessions': 'Ingen verifiserte treningsøkter ennå',
    'log.no_filtered_sessions': 'Ingen treningsøkter matcher de valgte filtrene',
    'log.scan_first': 'Skann QR-koden på skytebanen for å registrere din første økt',
    'log.change_filters': 'Prøv å endre filtrene for å se flere treningsøkter',
    'log.range': 'Bane:',
    'log.duration': 'Varighet:',
    'log.verified_by': 'Verifisert av:',
    'log.verified': 'Verifisert',
    'log.training': 'Trening',
    'log.competition': 'Stevne',
    'log.volunteer_work': 'Dugnad',
    
    // Profile
    'profile.title': 'Din Profil',
    'profile.description': 'Se og administrer din medlemsprofil',
    'profile.member': 'Medlem',
    'profile.email': 'E-post',
    'profile.member_id': 'Skytter ID',
    'profile.find_id': 'Finn din ID',
    'profile.member_since': 'Medlem siden',
    'profile.not_specified': 'Ikke angitt',
    'profile.edit_profile': 'Rediger Profil',
    'profile.save': 'Lagre',
    'profile.cancel': 'Avbryt',
    
    // Admin
    'admin.title': 'Administrasjon',
    'admin.description': 'Administrer medlemmer, treningsøkter og systeminnstillinger',
    'admin.add_training': 'Registrer Trening',
    'admin.member_management': 'Medlemsadministrasjon',
    'admin.training_approvals': 'Treningsgodkjenninger',
    'admin.settings': 'Innstillinger',
    'admin.language_settings': 'Språkinnstillinger',
    'admin.current_language': 'Nåværende språk',
    'admin.select_language': 'Velg språk',
    'admin.save_settings': 'Lagre innstillinger',
    'admin.language_saved': 'Språkinnstillinger lagret! Siden oppdateres...',
    'admin.request_language': 'Savner du et språk?',
    'admin.request_description': 'Skriv inn ønsket språk og send forespørsel til oss:',
    'admin.language_request_placeholder': 'F.eks. Nederlandsk, Russisk, Arabisk...',
    'admin.send_request': 'Send forespørsel',
    'admin.request_sent': 'Språkforespørsel sendt!',
    'admin.member_management': 'Medlemsadministrasjon',
    'admin.pending_approvals': 'Ventende godkjenninger',
    'admin.approved_members': 'Godkjente medlemmer',
    'admin.approve_all': 'Godkjenn alle',
    'admin.add_member': 'Legg til medlem',
    'admin.edit_member': 'Rediger medlem',
    'admin.delete_member': 'Slett medlem',
    'admin.approve_member': 'Godkjenn medlem',
    'admin.unapprove_member': 'Fjern godkjenning',
    'admin.toggle_admin': 'Bytt admin-rolle',
    'admin.no_pending_members': 'Ingen ventende medlemmer å godkjenne',
    'admin.search_members': 'Søk etter medlem...',
    'admin.name': 'Navn',
    'admin.email': 'E-post',
    'admin.member_id': 'ID',
    'admin.registered': 'Registrert',
    'admin.role': 'Rolle',
    'admin.actions': 'Handling',
    'admin.user_role': 'Bruker',
    'admin.admin_role': 'Admin',
    'admin.showing_members': 'Viser {start} - {end} av {total} medlemmer',
    'admin.previous': 'Forrige',
    'admin.next': 'Neste',
    'admin.organization_info': 'Grunnleggende informasjon',
    'admin.organization_name': 'Organisasjonsnavn',
    'admin.subscription_plan': 'Abonnementsplan',
    'admin.description': 'Beskrivelse',
    'admin.contact_info': 'Kontaktinformasjon',
    'admin.phone': 'Telefon',
    'admin.website': 'Nettside',
    'admin.address': 'Adresse',
    'admin.visual_profile': 'Visuell profil',
    'admin.organization_logo': 'Organisasjonslogo',
    'admin.current_logo': 'Nåværende logo',
    'admin.upload_new_logo': 'Last opp ny logo',
    'admin.primary_color': 'Primærfarge',
    'admin.secondary_color': 'Sekundærfarge',
    'admin.background_color': 'Bakgrunnsfarge (mørkt tema)',
    'admin.color_preview': 'Forhåndsvisning av farger',
    'admin.save_settings': 'Lagre innstillinger',
    'admin.settings_saved': 'Innstillinger lagret! Siden oppdateres...',
    
    // Scanner page
    'scanner.title': 'Skann QR-kode',
    'scanner.description': 'Skann QR-koden på skytebanen for å registrere oppmøte på trening',
    'scanner.start_scanning': 'Start Skanning',
    'scanner.start_camera': 'Start Kamera',
    'scanner.cancel_scanning': 'Avbryt skanning',
    'scanner.manual_input': 'Manuell innskriving',
    
    // Profile page
    'profile.title': 'Din Profil',
    'profile.description': 'Se og administrer din medlemsprofil',
    'profile.member': 'Medlem',
    'profile.email': 'E-post',
    'profile.member_id': 'Skytter ID',
    'profile.find_id': 'Finn din ID',
    'profile.member_since': 'Medlem siden',
    'profile.not_specified': 'Ikke angitt',
    'profile.edit_profile': 'Rediger Profil',
    'profile.save': 'Lagre',
    'profile.cancel': 'Avbryt',
    'profile.upload_startkort': 'Last opp ditt Startkort',
    'profile.find_startkort': 'Her finner du startkortet',
    'profile.upload_membercard': 'Last opp ditt Medlemskort',
    'profile.find_membercard': 'Her finner du medlemskortet',
    'profile.file_uploaded': 'Fil lastet opp:',
    'profile.download_file': 'Last ned fil',
    'profile.no_file_uploaded': 'Ingen fil lastet opp',
    'profile.change_file': 'Bytt fil',
    'profile.upload_file': 'Last opp fil',
    'profile.uploading': 'Laster opp...',
    'profile.personal_settings': 'Personlige innstillinger',
    'profile.theme_preference': 'Tema-preferanse',
    'profile.other_files': 'Andre filer (Våpenkort, våpenskap, etc)',
    'profile.upload_weapon_cards': 'Last opp våpenkort og andre relevante filer',
    'profile.upload_files': 'Last opp filer',
    'profile.file_number': 'Fil {number}:',
    'profile.download': 'Last ned',
    'profile.delete': 'Slett',
    'profile.no_files_uploaded': 'Ingen filer lastet opp',
    'profile.startkort_membercard': 'Startkort og Medlemskort',
    'profile.optional': 'Valgfritt',
    
    // Admin tabs and sections
    'admin.overview': 'Dagens',
    'admin.members': 'Medlem',
    'admin.log': 'Logg',
    'admin.officers': 'Ledere',
    'admin.settings': 'Innstillinger',
    'admin.qr_codes': 'QR-koder',
    'admin.all_training_registrations': 'Alle treningsregistreringer',
    'admin.overview_description': 'Oversikt over alle treningsregistreringer med klikkbare status-ikoner',
    'admin.quick_approval': 'Hurtig-godkjenning',
    'admin.quick_approval_description': 'Godkjenn flere registreringer samtidig',
    'admin.approve_today': 'Godkjenn dagens',
    'admin.select_date': 'Velg dato',
    'admin.click_status_tip': 'Klikk på status-ikonene for å endre mellom godkjent/ikke godkjent',
    'admin.full_training_log': 'Full Treningslogg',
    'admin.full_log_description': 'Komplett oversikt over alle treningsøkter med klikkbare status-ikoner',
    'admin.download_pdf': 'Last ned PDF',
    'admin.filter_sessions': 'Filtrer treningsøkter',
    'admin.search_member': 'Søk etter medlem...',
    'admin.all_ranges': 'Alle baner',
    'admin.all_officers': 'Alle standplassledere',
    'admin.all_statuses': 'Alle statuser',
    'admin.verified': 'Verifisert',
    'admin.not_verified': 'Ikke verifisert',
    'admin.showing_sessions': 'Viser {count} av {total} treningsøkter',
    'admin.date': 'Dato',
    'admin.member': 'Medlem',
    'admin.activity': 'Aktivitet',
    'admin.range': 'Bane',
    'admin.range_officer': 'Standplassleder',
    'admin.status': 'Status',
    'admin.actions': 'Handlinger',
    'admin.no_sessions_found': 'Ingen treningsøkter funnet',
    'admin.change_filters': 'Prøv å endre filtrene for å se flere treningsøkter',
    'admin.previous': 'Forrige',
    'admin.next': 'Neste',
    'admin.showing_entries': 'Viser {start} - {end} av {total} oppføringer',
    
    // Additional admin translations
    'admin.indoor_25m': 'Innendørs 25m',
    'admin.outdoor_25m': 'Utendørs 25m',
    'admin.edit_session': 'Rediger treningsøkt',
    
    // Additional scanner translations
    'scanner.start_camera_description': 'Klikk på knappen under for å aktivere kamera og skanne QR-kode',
    
    // Common
    'common.loading': 'Laster...',
    'common.error': 'Feil',
    'common.success': 'Suksess',
    'common.save': 'Lagre',
    'common.cancel': 'Avbryt',
    'common.edit': 'Rediger',
    'common.delete': 'Slett',
    'common.add': 'Legg til',
    'common.close': 'Lukk',
    'common.yes': 'Ja',
    'common.no': 'Nei'
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.scanner': 'Scan',
    'nav.log': 'Training Log',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.logout': 'Log out',
    
    // Home page
    'home.welcome': 'Welcome to {name}\'s Training Log',
    'home.description': 'Register your training hours easily and securely. Scan the QR code at the shooting range to start your session.',
    
    // Training Log
    'log.title': 'Training Log',
    'log.description': 'Overview of your registered training sessions and requirement status for weapon applications',
    'log.your_sessions': 'Your Training Sessions',
    'log.nsf_training_weapons': 'NSF Training Weapons',
    'log.dfs_field_shooting': 'DFS Field Shooting',
    'log.dynamic_weapon_application': 'Dynamic Weapon Application',
    'log.fulfilled': 'FULFILLED',
    'log.trainings_remaining': '{count} trainings remaining',
    'log.competitions_remaining': '{count} competitions remaining',
    'log.nsf_info_title': 'NSF - Training Weapons',
    'log.nsf_info_requirement': 'Requirements for training weapons (NSF):',
    'log.nsf_info_10_trainings': '• At least 10 trainings in the last 24 months',
    'log.nsf_info_all_types': '• All types of training activities count',
    'log.nsf_info_weapons': '• Applies to pistol, revolver and rifle',
    'log.nsf_info_documented': '• Documented activity in approved shooting club',
    'log.dfs_info_title': 'DFS - Field Shooting',
    'log.dfs_info_requirement': 'Requirements for field shooting (DFS):',
    'log.dfs_info_10_trainings': '• At least 10 trainings in the last 24 months',
    'log.dfs_info_field_hunting': '• Field shooting and hunting-related activities',
    'log.dfs_info_weapons': '• Applies to rifle and shotgun',
    'log.dfs_info_documented': '• Documented activity in approved shooting club',
    'log.dssn_info_title': 'DSSN - Dynamic',
    'log.dssn_info_requirement': 'Requirements for dynamic shooting (DSSN):',
    'log.dssn_info_weapons': '• Weapons can be acquired through DSSN and their shooting programs',
    'log.dssn_info_same_rules': '• Same rules as other shooting organizations',
    'log.dssn_info_rifle_exception': 'Exception for rifle: 24 months quarantine period after passed approval course',
    'log.dssn_info_activity_requirement': '• Activity requirement in addition to quarantine period',
    'log.dssn_info_green_activities': 'Green activities count for dynamic shooting',
    'log.no_sessions': 'No verified training sessions yet',
    'log.no_filtered_sessions': 'No training sessions match the selected filters',
    'log.scan_first': 'Scan the QR code at the shooting range to register your first session',
    'log.change_filters': 'Try changing the filters to see more training sessions',
    'log.range': 'Range:',
    'log.duration': 'Duration:',
    'log.verified_by': 'Verified by:',
    'log.type': 'Type:',
    'log.results': 'Results:',
    'log.target_images': 'Target Images:',
    'log.images': 'image(s)',
    'log.verified': 'Verified',
    'log.edit_session': 'Edit training session',
    
    // Scanner
    'scanner.title': 'Scan QR Code',
    'scanner.description': 'Scan the QR code at the shooting range to register attendance at training',
    'scanner.start_scanning': 'Start Scanning',
    'scanner.start_camera': 'Start Camera',
    'scanner.cancel_scanning': 'Cancel scanning',
    
    // Profile
    'profile.title': 'Your Profile',
    'profile.description': 'View and manage your member profile',
    'profile.member': 'Member',
    'profile.email': 'Email',
    'profile.member_id': 'Shooter ID',
    'profile.find_id': 'Find your ID',
    'profile.member_since': 'Member since',
    'profile.not_specified': 'Not specified',
    'profile.edit_profile': 'Edit Profile',
    'profile.save': 'Save',
    'profile.cancel': 'Cancel',
    'profile.upload_startkort': 'Upload your Start Card',
    'profile.find_startkort': 'Find your start card here',
    'profile.upload_membercard': 'Upload your Member Card',
    'profile.find_membercard': 'Find your member card here',
    'profile.file_uploaded': 'File uploaded:',
    'profile.download_file': 'Download file',
    'profile.no_file_uploaded': 'No file uploaded',
    'profile.change_file': 'Change file',
    'profile.upload_file': 'Upload file',
    'profile.uploading': 'Uploading...',
    'profile.personal_settings': 'Personal settings',
    'profile.theme_preference': 'Theme preference',
    'profile.other_files': 'Other files (Weapon cards, gun safe, etc)',
    'profile.upload_weapon_cards': 'Upload weapon cards and other relevant files',
    'profile.upload_files': 'Upload files',
    'profile.file_number': 'File {number}:',
    'profile.download': 'Download',
    'profile.delete': 'Delete',
    'profile.no_files_uploaded': 'No files uploaded',
    'profile.startkort_membercard': 'Start Card and Member Card',
    'profile.optional': 'Optional',
    
    // Admin
    'admin.title': 'Administration',
    'admin.description': 'Manage members, training sessions and system settings',
    'admin.add_training': 'Register Training',
    'admin.member_management': 'Member Management',
    'admin.pending_approvals': 'Pending approvals',
    'admin.approve_all': 'Approve all',
    'admin.add_member': 'Add member',
    'admin.edit_member': 'Edit member',
    'admin.approve_member': 'Approve member',
    'admin.unapprove_member': 'Remove approval',
    'admin.toggle_admin': 'Toggle admin role',
    'admin.no_pending_members': 'No pending members to approve',
    'admin.search_members': 'Search for member...',
    'admin.name': 'Name',
    'admin.email': 'Email',
    'admin.member_id': 'ID',
    'admin.registered': 'Registered',
    'admin.role': 'Role',
    'admin.actions': 'Actions',
    'admin.user_role': 'User',
    'admin.admin_role': 'Admin',
    'admin.showing_members': 'Showing {start} - {end} of {total} members',
    'admin.previous': 'Previous',
    'admin.next': 'Next',
    'admin.save_settings': 'Save settings',
    'admin.settings_saved': 'Settings saved! Page updating...',
    'admin.edit_session': 'Edit training session',
    'admin.showing_entries': 'Showing {start} - {end} of {total} entries',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.close': 'Close'
  },
  sv: {},
  da: {},
  fi: {},
  de: {},
  fr: {},
  es: {},
  it: {},
  pl: {}
};

// Language configuration
export const languages = [
  { code: 'no', name: 'Norsk', flag: '🇳🇴' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' }
];

// Get current language from localStorage
export function getCurrentLanguage(): string {
  try {
    const saved = localStorage.getItem('selectedLanguage');
    return saved || 'no';
  } catch {
    return 'no';
  }
}

// Set current language
export function setCurrentLanguage(languageCode: string): void {
  localStorage.setItem('selectedLanguage', languageCode);
}

// Translation function
export function t(key: string, params?: { [key: string]: string | number }): string {
  const currentLang = getCurrentLanguage();
  const translation = translations[currentLang]?.[key] || translations.no[key] || key;
  
  if (params) {
    return Object.entries(params).reduce((text, [param, value]) => {
      return text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    }, translation);
  }
  
  return translation;
}

// Google Translate API integration
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  try {
    // Use Google Translate API (free tier)
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=no&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`);
    
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    return data[0][0][0] || text;
  } catch (error) {
    console.warn('Translation failed, using original text:', error);
    return text;
  }
}

// Translate all Norwegian texts to target language
export async function translateLanguage(targetLanguage: string): Promise<void> {
  if (targetLanguage === 'no' || translations[targetLanguage] && Object.keys(translations[targetLanguage]).length > 0) {
    return; // Already translated or Norwegian
  }

  try {
    const norwegianTexts = translations.no;
    const translatedTexts: TranslationKey = {};
    
    // Translate in batches to avoid rate limiting
    const entries = Object.entries(norwegianTexts);
    const batchSize = 10;
    
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      const translationPromises = batch.map(async ([key, text]) => {
        const translated = await translateText(text, targetLanguage);
        return [key, translated];
      });
      
      const batchResults = await Promise.all(translationPromises);
      batchResults.forEach(([key, translated]) => {
        translatedTexts[key] = translated;
      });
      
      // Small delay between batches
      if (i + batchSize < entries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    translations[targetLanguage] = translatedTexts;
    
    // Save translations to localStorage for caching
    localStorage.setItem(`translations_${targetLanguage}`, JSON.stringify(translatedTexts));
    
  } catch (error) {
    console.error('Error translating language:', error);
    throw error;
  }
}

// Load cached translations from localStorage
export function loadCachedTranslations(): void {
  languages.forEach(lang => {
    if (lang.code !== 'no') {
      try {
        const cached = localStorage.getItem(`translations_${lang.code}`);
        if (cached) {
          translations[lang.code] = JSON.parse(cached);
        }
      } catch (error) {
        console.warn(`Failed to load cached translations for ${lang.code}:`, error);
      }
    }
  });
}

// Initialize translations on app start
loadCachedTranslations();