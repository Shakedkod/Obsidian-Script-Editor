import { Translations } from "../types";

export const he: Translations = {
    pdf: {
        writtenBy: "נכתב על ידי",
        producedBy: "הופק על ידי",
        date: "תאריך",
    },
    notices: {
        exportSuccess: "התסריט יוצא לPDF בהצלחה.",
        exportFailed: "נכשל ייצוא התסריט",
        characterNotFound: "דמות לא נמצאה.",
    },
    menu: {
        switchToPreview: "עבור למצב תצוגה מקדימה",
        switchToSource: "עבור למצב מקור",
        editMetadata: "ערוך נתונים",
        exportToPdf: "ייצא ל־PDF",
    },
    scriptEditor: {
        properties: "מאפיינים",
        title: "כותרת",
        subtitle: "כותרת משנה",
        writers: "כותבים",
        productionCompany: "חברת הפקה",
        date: "תאריך",
        characterFolder: "תיקיית דמויות",
        locationFolder: "תיקיית מיקומים",
    },
    autocomplete: {
        sceneTypes: ["פנים.", "חוץ.", "פנים/חוץ.", "חוץ/פנים."],
        timesOfDay: [
            "יום",
            "לילה",
            "בוקר",
            "ערב",
            "צהריים",
            "אחר הצהריים",
            "בין ערביים",
            "זריחה",
            "שקיעה",
            "המשך",
            "מאוחר יותר",
            "בו זמנית",
        ],
    },
};
