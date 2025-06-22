export interface Translations {
    pdf: {
        writtenBy: string;
        producedBy: string;
        date: string;
    };
    notices: {
        exportSuccess: string;
        exportFailed: string;
        characterNotFound: string;
    };
    menu: {
        switchToPreview: string;
        switchToSource: string;
        editMetadata: string;
        exportToPdf: string;
    };
    scriptEditor: {
        properties: string;
        title: string;
        subtitle: string;
        writers: string;
        productionCompany: string;
        date: string;
    };
}

export type SupportedLanguage = 'en' | 'he' | 'es' | 'fr' | 'de'; // Add more as needed

export interface LanguageConfig {
    code: SupportedLanguage;
    name: string;
    isRTL: boolean;
    fontFamily?: string;
}