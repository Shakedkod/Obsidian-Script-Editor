import { translations } from "./translations";
import { LANGUAGE_CONFIGS } from "./languages";
import { SupportedLanguage, LanguageConfig, Translations } from "./types";

function resolveNestedString(source: unknown, keys: string[]): string | undefined {
    let current: unknown = source;
    for (const key of keys) {
        if (typeof current === "object" && current !== null && key in current) {
            current = (current as Record<string, unknown>)[key];
        } else {
            return undefined;
        }
    }
    return typeof current === "string" ? current : undefined;
}

export class I18n {
    private currentLanguage: SupportedLanguage = "en";
    private fallbackLanguage: SupportedLanguage = "en";

    constructor(language?: SupportedLanguage) {
        if (language) {
            this.setLanguage(language);
        }
    }

    setLanguage(language: SupportedLanguage): void {
        if (translations[language]) {
            this.currentLanguage = language;
        } else {
            this.currentLanguage = this.fallbackLanguage;
        }
    }

    setLanguageFromString(language: string): void {
        this.setLanguage(language as SupportedLanguage);
    }

    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguage;
    }

    getLanguageConfig(): LanguageConfig {
        return LANGUAGE_CONFIGS[this.currentLanguage];
    }

    getTranslations(language?: SupportedLanguage): Translations {
        const lang = language ?? this.currentLanguage;
        return translations[lang] ?? translations[this.fallbackLanguage];
    }

    isRTL(): boolean {
        return this.getLanguageConfig().isRTL;
    }

    t(key: string): string {
        const keys = key.split(".");
        const result =
            resolveNestedString(translations[this.currentLanguage], keys) ??
            resolveNestedString(translations[this.fallbackLanguage], keys);

        return result ?? key;
    }

    public static detectLanguage(text: string): SupportedLanguage {
        if (/[\u0590-\u05FF]/.test(text)) {
            return "he";
        }
        return "en";
    }
}

export const i18n = new I18n();
export const i18nPDF = new I18n();

export function isRTL(text?: string): boolean {
    if (text) {
        const detectedLang = I18n.detectLanguage(text);
        return LANGUAGE_CONFIGS[detectedLang].isRTL;
    }
    return i18n.isRTL();
}

export function getTextDirection(text: string): "rtl" | "ltr" {
    return isRTL(text) ? "rtl" : "ltr";
}

export function getTextAlign(text: string): "right" | "left" {
    return isRTL(text) ? "right" : "left";
}
