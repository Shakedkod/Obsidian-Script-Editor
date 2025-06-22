import { en } from './en';
import { he } from './he';
import { es } from './es';
import { SupportedLanguage, Translations } from '../types';

export const translations: Record<SupportedLanguage, Translations> = {
    en,
    he,
    es,
    fr: en, // Fallback to English for now
    de: en, // Fallback to English for now
};