import { Translations } from "../types";

export const es: Translations = {
    pdf: {
        writtenBy: "escrito por",
        producedBy: "producido por",
        date: "fecha",
    },
    notices: {
        exportSuccess: "Guión exportado a PDF exitosamente.",
        exportFailed: "Error al exportar guión",
        characterNotFound: "Personaje no encontrado.",
    },
    menu: {
        switchToPreview: "Cambiar a modo vista previa",
        switchToSource: "Cambiar a modo fuente",
        editMetadata: "Editar metadatos",
        exportToPdf: "Exportar a PDF",
    },
    scriptEditor: {
        properties: "Propiedades",
        title: "Título",
        subtitle: "Subtítulo",
        writers: "Escritores",
        productionCompany: "Compañía de producción",
        date: "Fecha",
        characterFolder: "Carpeta de personajes",
        locationFolder: "Carpeta de ubicaciones",
    },
    autocomplete: {
        sceneTypes: ["INT.", "EXT.", "INT./EXT.", "EXT./INT."],
        timesOfDay: [
            "DÍA",
            "NOCHE",
            "MAÑANA",
            "TARDE",
            "ATARDECER",
            "AMANECER",
            "MÁS TARDE",
            "CONTINUO",
            "MISMO TIEMPO",
        ],
    },
};
