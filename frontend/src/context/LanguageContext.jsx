import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from './translations/en';
import { fr } from './translations/fr';

const translations = { en, fr };

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key, params = {}) => {
        const keys = key.split('.');
        let value = translations[language];
        
        for (const k of keys) {
            if (value && value[k] !== undefined) {
                value = value[k];
            } else {
                // Fallback to English if translation is missing in the current language
                let fallback = translations['en'];
                for (const fk of keys) {
                    if (fallback && fallback[fk] !== undefined) {
                        fallback = fallback[fk];
                    } else {
                        return key;
                    }
                }
                value = fallback;
                break;
            }
        }

        if (typeof value === 'string') {
            let result = value;
            Object.keys(params).forEach((param) => {
                result = result.replace(new RegExp(`{${param}}`, 'g'), params[param]);
            });
            return result;
        }

        return typeof value === 'object' ? key : value;
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'fr' : 'en'));
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
