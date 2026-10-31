import { Translations } from "../types";

export const en: Translations = {
    pdf: {
        writtenBy: "Written by",
        producedBy: "Produced by",
        date: "Date",
    },
    notices: {
        exportSuccess: "Script exported to PDF successfully.",
        exportFailed: "Failed to export script",
        characterNotFound: "Character not found.",
    },
    menu: {
        switchToPreview: "Switch to preview mode",
        switchToSource: "Switch to source mode",
        editMetadata: "Edit metadata",
        exportToPdf: "Export to PDF",
    },
    scriptEditor: {
        properties: "Properties",
        title: "Title",
        subtitle: "Subtitle",
        writers: "Writers",
        productionCompany: "Production Company",
        date: "Date",
        characterFolder: "Character Folder",
        locationFolder: "Location Folder",
    },
    autocomplete: {
        sceneTypes: ["INT.", "EXT.", "INT./EXT.", "EXT./INT.", "I/E."],
        timesOfDay: [
            "DAY",
            "NIGHT",
            "MORNING",
            "EVENING",
            "AFTERNOON",
            "DUSK",
            "DAWN",
            "LATER",
            "CONTINUOUS",
            "MOMENTS LATER",
            "SAME TIME",
        ],
    },
};
