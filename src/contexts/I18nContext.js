import React, { createContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from '../i18n/locales/en';
import { ar } from '../i18n/locales/ar';

export const I18nContext = createContext();

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState(Localization.locale);
  const [isRTL, setIsRTL] = useState(false);

  const i18n = new I18n({
    en,
    ar,
  });

  i18n.defaultLocale = 'en';
  i18n.enableFallback = true;

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLocale = await AsyncStorage.getItem('userLocale');
        if (savedLocale) {
          setLocale(savedLocale);
          setIsRTL(savedLocale.startsWith('ar'));
        } else {
          // Default to device locale, or English if not supported
          const deviceLocale = Localization.locale.split('-')[0];
          const supportedLocale = ['en', 'ar'].includes(deviceLocale) ? deviceLocale : 'en';
          setLocale(supportedLocale);
          setIsRTL(supportedLocale === 'ar');
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
        setLocale('en');
        setIsRTL(false);
      }
    };

    loadSavedLanguage();
  }, []);

  const changeLanguage = async (newLocale) => {
    try {
      await AsyncStorage.setItem('userLocale', newLocale);
      setLocale(newLocale);
      setIsRTL(newLocale === 'ar');
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  i18n.locale = locale;

  const t = (key, options) => {
    return i18n.t(key, options);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        isRTL,
        t,
        changeLanguage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};