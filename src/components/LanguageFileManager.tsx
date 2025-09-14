import { useState, useEffect } from 'react';
import { Download, Upload, Globe, Trash2, Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { translations, languages } from '../lib/translations';

interface LanguageFile {
  code: string;
  name: string;
  flag: string;
  translations: { [key: string]: string };
  lastModified: string;
}

export function LanguageFileManager() {
  const [uploadingLanguage, setUploadingLanguage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [newLanguageCode, setNewLanguageCode] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageFlag, setNewLanguageFlag] = useState('');
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  // Load cached translations into memory on component mount
  useEffect(() => {
    const loadCachedTranslations = () => {
      languages.forEach(language => {
        if (language.code !== 'no' && !translations[language.code]) {
          try {
            const cached = localStorage.getItem(`translations_${language.code}`);
            if (cached) {
              const cachedTranslations = JSON.parse(cached);
              translations[language.code] = cachedTranslations;
            }
          } catch (error) {
            console.error(`Error loading cached translations for ${language.code}:`, error);
          }
        }
      });
    };

    loadCachedTranslations();
  }, []);

  const downloadLanguageFile = (languageCode: string) => {
    try {
      const languageData = translations[languageCode] || {};
      const languageInfo = languages.find(lang => lang.code === languageCode);
      
      const languageFile: LanguageFile = {
        code: languageCode,
        name: languageInfo?.name || languageCode,
        flag: languageInfo?.flag || '🏳️',
        translations: languageData,
        lastModified: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(languageFile, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aktivlogg-${languageCode}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Language file downloaded: ${languageCode}`);
    } catch (error) {
      console.error('Error downloading language file:', error);
      setUploadError(`Kunne ikke laste ned språkfil for ${languageCode}`);
    }
  };

  const handleLanguageUpload = async (event: React.ChangeEvent<HTMLInputElement>, languageCode: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLanguage(languageCode);
      setUploadError(null);
      setUploadSuccess(null);

      // Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Kun JSON-filer er tillatt');
      }

      // Read file content
      const fileContent = await file.text();
      const languageFile: LanguageFile = JSON.parse(fileContent);

      // Validate file structure
      if (!languageFile.code || !languageFile.name || !languageFile.translations) {
        throw new Error('Ugyldig språkfil format. Mangler påkrevde felt.');
      }

      // Validate that the uploaded file matches the expected language code
      if (languageFile.code !== languageCode) {
        throw new Error(`Feil språkfil. Forventet ${languageCode}, men fikk ${languageFile.code}`);
      }

      // Update translations in memory
      translations[languageFile.code] = languageFile.translations;

      // Save to localStorage
      localStorage.setItem(`translations_${languageFile.code}`, JSON.stringify(languageFile.translations));

      setUploadSuccess(`Språkfil for ${languageFile.name} (${languageFile.code}) er lastet opp og aktivert!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000);

    } catch (error) {
      console.error('Error uploading language file:', error);
      setUploadError(error instanceof Error ? error.message : 'Kunne ikke laste opp språkfil');
    } finally {
      setUploadingLanguage(null);
      // Reset file input
      event.target.value = '';
    }
  };

  const addCustomLanguage = () => {
    if (!newLanguageCode.trim() || !newLanguageName.trim()) {
      setUploadError('Språkkode og navn må fylles ut');
      return;
    }

    // Check if language already exists
    const existingLanguage = languages.find(lang => lang.code === newLanguageCode.toLowerCase());
    if (existingLanguage) {
      setUploadError('Språkkode eksisterer allerede');
      return;
    }

    // Add new language
    const newLanguage = {
      code: newLanguageCode.toLowerCase(),
      name: newLanguageName,
      nativeName: newLanguageName, // Add missing nativeName
      flag: newLanguageFlag || '🏳️'
    };

    languages.push(newLanguage);
    
    // Initialize empty translations for new language
    translations[newLanguage.code] = {};
    
    // Save to localStorage
    localStorage.setItem('customLanguages', JSON.stringify(languages));
    localStorage.setItem(`translations_${newLanguage.code}`, JSON.stringify({}));

    setUploadSuccess(`Nytt språk "${newLanguageName}" (${newLanguageCode}) lagt til!`);
    
    // Reset form
    setNewLanguageCode('');
    setNewLanguageName('');
    setNewLanguageFlag('');
    setShowAddLanguage(false);
    
    // Clear success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000);
  };

  const removeCustomLanguage = (languageCode: string) => {
    const language = languages.find(lang => lang.code === languageCode);
    if (!language) return;

    if (!window.confirm(`Er du sikker på at du vil fjerne språket "${language.name}" (${languageCode})?`)) {
      return;
    }

    // Remove from languages array
    const updatedLanguages = languages.filter(lang => lang.code !== languageCode);
    
    // Remove translations
    delete translations[languageCode];
    localStorage.removeItem(`translations_${languageCode}`);
    
    // Save updated languages list
    localStorage.setItem('customLanguages', JSON.stringify(updatedLanguages));
    
    setUploadSuccess(`Språket "${language.name}" er fjernet`);
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const getTranslationCount = (languageCode: string): number => {
    // Check in-memory translations first
    const inMemoryCount = Object.keys(translations[languageCode] || {}).length;
    
    if (inMemoryCount > 0) {
      return inMemoryCount;
    }
    
    // Check localStorage for cached translations
    try {
      const cached = localStorage.getItem(`translations_${languageCode}`);
      if (cached) {
        const cachedTranslations = JSON.parse(cached);
        return Object.keys(cachedTranslations).length;
      }
    } catch (error) {
      console.error('Error loading cached translations:', error);
    }
    
    return 0;
  };

  const getCompletionPercentage = (languageCode: string): number => {
    const norwegianCount = Object.keys(translations.no || {}).length;
    const languageCount = getTranslationCount(languageCode);
    
    // For Norwegian, always return 100%
    if (languageCode === 'no') {
      return 100;
    }
    
    // Load cached translations from localStorage if not in memory
    if (languageCount === 0) {
      try {
        const cached = localStorage.getItem(`translations_${languageCode}`);
        if (cached) {
          const cachedTranslations = JSON.parse(cached);
          const cachedCount = Object.keys(cachedTranslations).length;
          return norwegianCount > 0 ? Math.round((cachedCount / norwegianCount) * 100) : 0;
        }
      } catch (error) {
        console.error('Error loading cached translations:', error);
      }
    }
    
    return norwegianCount > 0 ? Math.round((languageCount / norwegianCount) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5" />
          Språkfil Administrasjon
        </h3>
        <p className="text-gray-400 text-sm">
          Last ned språkfiler for redigering, eller last opp redigerte filer med opplastingsikonet
        </p>
      </div>

      {/* Add Custom Language */}
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">➕ Legg til nytt språk</h4>
          <button
            onClick={() => setShowAddLanguage(!showAddLanguage)}
            className="btn-secondary"
          >
            {showAddLanguage ? 'Lukk' : 'Legg til språk'}
          </button>
        </div>

        {showAddLanguage && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Språkkode *
                </label>
                <input
                  type="text"
                  value={newLanguageCode}
                  onChange={(e) => setNewLanguageCode(e.target.value.toLowerCase())}
                  className="w-full bg-gray-600 rounded-md px-3 py-2"
                  placeholder="f.eks. nl, ru, ar"
                  maxLength={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Språknavn *
                </label>
                <input
                  type="text"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  className="w-full bg-gray-600 rounded-md px-3 py-2"
                  placeholder="f.eks. Nederlands, Русский"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Flagg emoji
                </label>
                <input
                  type="text"
                  value={newLanguageFlag}
                  onChange={(e) => setNewLanguageFlag(e.target.value)}
                  className="w-full bg-gray-600 rounded-md px-3 py-2"
                  placeholder="🇳🇱"
                  maxLength={4}
                />
              </div>
            </div>
            
            <button
              onClick={addCustomLanguage}
              className="btn-primary"
              disabled={!newLanguageCode.trim() || !newLanguageName.trim()}
            >
              <Plus className="w-4 h-4" />
              Legg til språk
            </button>
          </div>
        )}
      </div>

      {/* Language Files List */}
      <div className="bg-gray-700 rounded-lg p-6">
        <h4 className="font-medium mb-4">📁 Tilgjengelige språkfiler</h4>
        
        <div className="space-y-3">
          {languages.map((language) => {
            const translationCount = getTranslationCount(language.code);
            const completionPercentage = getCompletionPercentage(language.code);
            const isCustomLanguage = !['no', 'en', 'sv', 'da', 'fi', 'de', 'fr', 'es', 'it', 'pl'].includes(language.code);
            
            return (
              <div key={language.code} className="bg-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{language.name}</span>
                        <span className="text-sm text-gray-400">({language.code})</span>
                        {isCustomLanguage && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Tilpasset
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {translationCount} oversettelser ({completionPercentage}% komplett)
                      </div>
                      {completionPercentage < 100 && language.code !== 'no' && (
                        <div className="w-32 bg-gray-500 rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-400 h-1 rounded-full" 
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadLanguageFile(language.code)}
                      className="btn-secondary"
                      title={`Last ned ${language.name} språkfil`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Last ned</span>
                    </button>
                    
                    <label className="btn-secondary cursor-pointer" title={`Last opp redigert ${language.name} språkfil`}>
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => handleLanguageUpload(e, language.code)}
                        className="hidden"
                      />
                      {uploadingLanguage === language.code ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Last opp</span>
                    </label>
                    
                    {isCustomLanguage && (
                      <button
                        onClick={() => removeCustomLanguage(language.code)}
                        className="p-2 text-red-400 hover:text-red-300"
                        title={`Fjern ${language.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h4 className="font-medium text-blue-400 mb-3">📋 Instruksjoner for språkfil-redigering</h4>
        <div className="space-y-3 text-sm text-blue-200">
          <div>
            <p className="font-medium">Slik redigerer du språkfiler:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Last ned ønsket språkfil ved å klikke "Last ned"</li>
              <li>Åpne JSON-filen i en teksteditor</li>
              <li>Rediger oversettelsene i "translations" objektet</li>
              <li>Lagre filen og last den opp igjen med opplastingsikonet</li>
              <li>Endringene trer i kraft umiddelbart</li>
            </ol>
          </div>
          
          <div>
            <p className="font-medium">Filstruktur:</p>
            <pre className="bg-gray-800 p-3 rounded text-xs overflow-x-auto mt-2">
{`{
  "code": "en",
  "name": "English", 
  "flag": "🇬🇧",
  "translations": {
    "nav.home": "Home",
    "nav.scanner": "Scan",
    "log.title": "Training Log"
  },
  "lastModified": "2025-01-20T10:30:00Z"
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {uploadError && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-4 bg-green-900/50 border border-green-700 rounded-lg flex items-center gap-2 text-green-200">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{uploadSuccess}</p>
        </div>
      )}
    </div>
  );
}