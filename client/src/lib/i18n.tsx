import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import arTranslations from '../translations/ar.json';
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';

// أنواع البيانات
type LocaleType = 'ar' | 'en' | 'fr';
type TranslationsType = typeof arTranslations;

// تكوين اللغات المدعومة
export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' }
];

// الحصول على اتجاه اللغة
export const getLanguageDirection = (locale: LocaleType): 'rtl' | 'ltr' => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === locale);
  return (lang?.dir as 'rtl' | 'ltr') || 'ltr';
};

interface I18nContextType {
  locale: LocaleType;
  translations: TranslationsType;
  setLocale: (locale: LocaleType) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  dir: () => 'rtl' | 'ltr';
  langName: () => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

// إنشاء السياق
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// مزود السياق
export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // تحديد اللغة الافتراضية (العربية)
  const [locale, setLocale] = useState<LocaleType>('ar');
  const [translations, setTranslations] = useState<TranslationsType>(arTranslations);

  // تحديث الترجمات عند تغيير اللغة
  useEffect(() => {
    const loadTranslations = () => {
      let newTranslations;
      const direction = getLanguageDirection(locale);
      
      // تحديد ملف الترجمة المناسب
      switch (locale) {
        case 'ar':
          newTranslations = arTranslations;
          break;
        case 'en':
          newTranslations = enTranslations;
          break;
        case 'fr':
          newTranslations = frTranslations;
          break;
        default:
          newTranslations = arTranslations;
      }
      
      // تطبيق الترجمات واتجاه النص
      setTranslations(newTranslations);
      document.documentElement.dir = direction;
      document.documentElement.lang = locale;
    };
    
    loadTranslations();
    
    // حفظ اللغة المحددة في التخزين المحلي
    localStorage.setItem('locale', locale);
  }, [locale]);

  // استرجاع اللغة المفضلة من التخزين المحلي عند التحميل
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as LocaleType | null;
    if (savedLocale && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLocale)) {
      setLocale(savedLocale);
    }
  }, []);

  // دالة للحصول على ترجمة من خلال المفتاح
  const t = (key: string, variables?: Record<string, string | number>): string => {
    // تقسيم المفتاح (مثال: "app.menu.home" إلى ["app", "menu", "home"])
    const keys = key.split('.');
    // البحث عن القيمة في كائن الترجمات
    let translation: any = translations;
    
    for (const k of keys) {
      translation = translation && translation[k];
      if (!translation) break;
    }
    
    // إذا لم يتم العثور على الترجمة، إرجاع المفتاح الأصلي
    if (!translation || typeof translation !== 'string') {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    // استبدال المتغيرات إن وجدت (مثال: "Hello {{name}}" و variables = { name: "John" })
    if (variables) {
      return Object.entries(variables).reduce((text, [varKey, varValue]) => {
        return text.replace(new RegExp(`{{${varKey}}}`, 'g'), String(varValue));
      }, translation);
    }
    
    return translation;
  };

  // دالة لتحديد اتجاه النص بناءً على اللغة الحالية
  const dir = (): 'rtl' | 'ltr' => {
    return locale === 'ar' ? 'rtl' : 'ltr';
  };

  // دالة للحصول على اسم اللغة الحالية
  const langName = (): string => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === locale);
    return lang?.name || 'العربية';
  };

  // توفير السياق للتطبيق
  return (
    <I18nContext.Provider value={{ 
      locale, 
      translations, 
      setLocale, 
      t, 
      dir, 
      langName,
      supportedLanguages: SUPPORTED_LANGUAGES 
    }}>
      {children}
    </I18nContext.Provider>
  );
};

// هوك لاستخدام الترجمة في المكونات
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// مكون لتبديل اللغة
export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, supportedLanguages, langName } = useTranslation();
  
  // تحديد اللغة التالية في القائمة بالتناوب
  const toggleLanguage = () => {
    const currentLangIndex = supportedLanguages.findIndex(lang => lang.code === locale);
    const nextLangIndex = (currentLangIndex + 1) % supportedLanguages.length;
    setLocale(supportedLanguages[nextLangIndex].code as LocaleType);
  };
  
  return (
    <button 
      onClick={toggleLanguage}
      className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100"
    >
      {langName()}
    </button>
  );
};

// واجهة منسدلة كاملة لاختيار اللغة
export const LanguageSelector: React.FC = () => {
  const { locale, setLocale, supportedLanguages } = useTranslation();
  
  return (
    <div className="relative inline-block text-left">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as LocaleType)}
        className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {supportedLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};