import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentLanguage, setCurrentLanguage, translateLanguage, t } from '../lib/translations';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (languageCode: string) => Promise<void>;
  t: (key: string, params?: { [key: string]: string | number }) => string;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState(getCurrentLanguage());
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = async (languageCode: string) => {
    try {
      setIsTranslating(true);
      
      // Translate if not already cached
      if (languageCode !== 'no') {
        await translateLanguage(languageCode);
      }
      
      // Update language
      setCurrentLanguage(languageCode);
      setCurrentLanguageState(languageCode);
      
      // Force re-render of all components
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: languageCode }));
      
    } catch (error) {
      console.error('Error setting language:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      t,
      isTranslating
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}