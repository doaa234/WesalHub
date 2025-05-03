import { I18n } from 'i18n-js';
import { useCallback } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './en';
import ar from './ar';

const i18n = new I18n({
  en,
  ar,
});

// Set the locale once at the beginning of your app
i18n.locale = Localization.locale.split('-')[0];
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Function to change language
export const changeLanguage = async (language) => {
  i18n.locale = language;
  
  // Save the language preference
  await AsyncStorage.setItem('userLanguage', language);
  
  // Handle RTL for Arabic
  const isRTL = language === 'ar';
  if (isRTL !== I18nManager.isRTL) {
    I18nManager.forceRTL(isRTL);
    // Reload the app to apply RTL changes
    if (Platform.OS === 'android') {
      NativeModules.DevSettings.reload();
    }
  }
};

// Custom hook to use translation
export const useTranslation = () => {
  const t = useCallback((key, options) => {
    return i18n.t(key, options);
  }, [i18n.locale]);
  
  return {
    t,
    locale: i18n.locale,
    isRTL: i18n.locale === 'ar',
    changeLanguage,
  };
};

export default i18n;