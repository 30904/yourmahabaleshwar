import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import mr from './locales/mr.json';
const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null;
i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, mr: { translation: mr } },
    lng: savedLang === 'mr' ? 'mr' : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});
if (!savedLang) {
    AsyncStorage.getItem('lang')
        .then((lng) => {
            if (lng === 'mr' || lng === 'en') i18n.changeLanguage(lng);
        })
        .catch(() => {});
}
export default i18n;
