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
        characterFolder: string;
        locationFolder: string;
    };
    autocomplete: {
        sceneTypes: string[];
        timesOfDay: string[];
    };
}

export type SupportedLanguage = "en" | "he" | "es" | "fr" | "de";

export interface LanguageConfig {
    code: SupportedLanguage;
    name: string;
    isRTL: boolean;
    fontFamily?: string;
}
