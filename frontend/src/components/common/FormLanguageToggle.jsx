import { useTranslation } from 'react-i18next';

export default function FormLanguageToggle({ className = '' }) {
  const { i18n } = useTranslation();

  const switchLang = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('lang', lng);
  };

  return (
    <div className={`inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 ${className}`}>
      <button
        type="button"
        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
          i18n.language === 'en' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
        onClick={() => switchLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
          i18n.language === 'mr' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
        }`}
        onClick={() => switchLang('mr')}
      >
        मर
      </button>
    </div>
  );
}
