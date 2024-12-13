import React, { createContext, useContext, useState } from 'react';
import { IntlProvider } from 'react-intl';
import enMessages from './messages/en';
import esMessages from './messages/es';

const messages = {
  en: enMessages,
  es: esMessages,
};

type Language = 'en' | 'es';

interface LanguageContextType {
  locale: Language;
  setLocale: (locale: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'en',
  setLocale: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Language>('es');

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider messages={messages[locale]} locale={locale} defaultLocale="es">
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};