import { translations } from './translations';
import { LANGUAGE_CONFIGS } from './languages';
import { SupportedLanguage, LanguageConfig } from './types';

export class I18n {
    private currentLanguage: SupportedLanguage = 'en';
    private fallbackLanguage: SupportedLanguage = 'en';

    constructor(language?: SupportedLanguage) {
        if (language) {
            this.setLanguage(language);
        }
    }

    setLanguage(language: SupportedLanguage): void {
        if (translations[language]) {
            this.currentLanguage = language;
        } else {
            console.warn(`Language ${language} not supported, falling back to ${this.fallbackLanguage}`);
            this.currentLanguage = this.fallbackLanguage;
        }
    }

    setLanguageFromString(language: string): void 
    {
        const lang = language as SupportedLanguage;
        if (translations[lang]) {
            this.currentLanguage = lang;
        } else {
            console.warn(`Language ${lang} not supported, falling back to ${this.fallbackLanguage}`);
            this.currentLanguage = this.fallbackLanguage;
        }
    }

    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    getLanguageConfig(): LanguageConfig {
        return LANGUAGE_CONFIGS[this.currentLanguage];
    }

    isRTL(): boolean {
        return this.getLanguageConfig().isRTL;
    }

    t(key: string): string {
        const keys = key.split('.');
        let value: any = translations[this.currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                // Fallback to English if key not found
                value = translations[this.fallbackLanguage];
                for (const fallbackKey of keys) {
                    if (value && typeof value === 'object' && fallbackKey in value) {
                        value = value[fallbackKey];
                    } else {
                        console.warn(`Translation key "${key}" not found`);
                        return key; // Return the key itself as fallback
                    }
                }
                break;
            }
        }
        
        return typeof value === 'string' ? value : key;
    }

    // Utility method to detect language from text
    public static detectLanguage(text: string): SupportedLanguage {
        // Hebrew detection
        if (/[\u0590-\u05FF]/.test(text))
            return 'he';
        
        // TODO: Add more language detection logic here
        
        // Default to English
        return 'en';
    }

    // Utility method for text direction and alignment
    getTextAlignment(text?: string): 'left' | 'right' | 'center' {
        const language = text ? I18n.detectLanguage(text) : this.currentLanguage;
        const config = LANGUAGE_CONFIGS[language];
        return config.isRTL ? 'right' : 'left';
    }

    // Utility method for positioning text in RTL contexts
    getTextPosition(text: string, textWidth: number, containerWidth: number, margin: number = 0): number {
        const isTextRTL = I18n.detectLanguage(text);
        const config = LANGUAGE_CONFIGS[isTextRTL];
        
        if (config.isRTL) {
            return containerWidth - margin - textWidth;
        } else {
            return margin;
        }
    }
}

// Create a singleton instance
export const i18n = new I18n();
export const i18nPDF = new I18n();

// Utility functions for backwards compatibility and convenience
export function isRTL(text?: string): boolean {
    if (text) {
        const detectedLang = I18n.detectLanguage(text);
        return LANGUAGE_CONFIGS[detectedLang].isRTL;
    }
    return i18n.isRTL();
}

export function isHebrew(text: string): boolean {
    return I18n.detectLanguage(text) === 'he';
}

// Usage examples and helper functions
export function formatDate(date: Date, language?: SupportedLanguage): string {
    const locale = language || i18n.getCurrentLanguage();
    
    const localeMap: Record<SupportedLanguage, string> = {
        en: 'en-US',
        he: 'he-IL',
        es: 'es-ES',
        fr: 'fr-FR',
        de: 'de-DE',
    };
    
    return date.toLocaleDateString(localeMap[locale]);
}