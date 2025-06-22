import { LanguageConfig, SupportedLanguage } from "./types";

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
    en: {
        code: 'en',
        name: 'English',
        isRTL: false,
    },
    he: {
        code: 'he',
        name: 'עברית',
        isRTL: true,
    },
    es: {
        code: 'es',
        name: 'Español',
        isRTL: false,
    },
    fr: {
        code: 'fr',
        name: 'Français',
        isRTL: false,
    },
    de: {
        code: 'de',
        name: 'Deutsch',
        isRTL: false,
    },
};