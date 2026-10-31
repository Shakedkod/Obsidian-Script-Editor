import PDFDocument from "pdfkit";

interface PDFKitFontInternals {
    _fontFamilies?: Record<string, unknown>;
    _fontCount?: number;
    _registeredFonts?: Record<string, unknown>;
    initFonts?: () => void;
}

// Override initFonts so PDFKit initializes its font registry without attempting to read filesystem fonts
(PDFDocument.prototype as unknown as PDFKitFontInternals).initFonts = function (
    this: PDFKitFontInternals
) {
    this._fontFamilies = this._fontFamilies || {};
    this._fontCount = this._fontCount || 0;
    this._registeredFonts = this._registeredFonts || {};
};

export {};
