import PDFDocument from "pdfkit";

// Override initFonts to initialize registry but not load default fonts
(PDFDocument.prototype as any).initFonts = function(this: any) {
    // Initialize the internal font registry
    // Based on PDFKit source code structure
    this._fontFamilies = this._fontFamilies || {};
    this._fontCount = this._fontCount || 0;
    
    // Initialize font registry object if it doesn't exist
    if (!this._registeredFonts) {
        this._registeredFonts = {};
    }
};

export {};