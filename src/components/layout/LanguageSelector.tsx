import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

export const LanguageSelector = () => {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="relative group">
      <button className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors duration-200">
        <Globe className="h-5 w-5" />
        <span className="text-sm font-medium uppercase">{locale}</span>
      </button>
      <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="py-1">
          <button
            onClick={() => setLocale('en')}
            className={`block w-full px-4 py-2 text-sm text-left ${
              locale === 'en' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLocale('es')}
            className={`block w-full px-4 py-2 text-sm text-left ${
              locale === 'es' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Español
          </button>
        </div>
      </div>
    </div>
  );
};