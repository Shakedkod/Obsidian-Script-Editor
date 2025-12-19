import './pdfkitPatch';
import PDFDocument from "pdfkit";
import blobStream from 'blob-stream';
import { Scene, Script, ScriptElement, ScriptElementType } from '../models/ScriptModel';
import { I18n, i18nPDF, isRTL } from "../i18n/i18n";
import { saveAs } from "./fileSaver";

// import bundled fonts (yes, I know it displays an error in the editor, but it works)
import CourierRegular from "../fonts/Courier-Regular.otf";
import CourierBold from "../fonts/Courier-Bold.ttf";
import AlefRegular from "../fonts/Alef-Regular.ttf";
import AlefBold from "../fonts/Alef-Bold.ttf";

// ============================================================================
// CONSTANTS
// ============================================================================

const ONE_INCH = 72; // 1 inch in points
const BASE_PAGE_OPTIONS: PDFKit.PDFDocumentOptions = {
    size: "LETTER",
    margin: ONE_INCH,
    autoFirstPage: false,
};
const PAGE_OPTIONS: PDFKit.PDFDocumentOptions = {
    ...BASE_PAGE_OPTIONS,
    font: "Regular",
};

const FONT_SIZES = {
    TITLE: 36,
    SUBTITLE: 14,
    DEFAULT: 12,
} as const;

const DIMENSIONS = {
    DIALOGUE_BOX_WIDTH: 300,
} as const;

type PDFType = typeof PDFDocument;

// ============================================================================
// TEXT FORMATTING UTILITIES
// ============================================================================

/**
 * Fixes parentheses direction for RTL text display
 */
function fixParenthesesInRTL(text: string): string {
    if (!isRTL(text)) return text;
    
    // Swap regular parentheses in RTL text
    text = text.replace(/\(([^)]+)\)/g, (_match, inner) => `)${inner}(`);
    // Swap square brackets in RTL text
    text = text.replace(/(\[)([^\]]+)(\])/g, (_match, open, inner, close) => `${close}${inner}${open}`);
    // Swap curly braces in RTL text
    text = text.replace(/(\{)([^\}]+)(\})/g, (_match, open, inner, close) => `${close}${inner}${open}`);
    
    return text;
}

/**
 * Formats text for LTR languages in PDF (reverses numbers for RTL context)
 */
function formatTextForLTRLangsPDF(text: string): string {
    return text.replace(/\d+/g, (match) => match.split('').reverse().join(''));
}

/**
 * Prepares text for PDF rendering based on text direction
 */
function prepareTextForPDF(text: string): string {
    return isRTL(text) ? formatTextForLTRLangsPDF(fixParenthesesInRTL(text)) : text;
}

/**
 * Gets OpenType features for text based on direction
 */
function getTextFeatures(text: string): PDFKit.Mixins.OpenTypeFeatures[] {
    return isRTL(text) ? ["rtla"] : [];
}

// ============================================================================
// PAGE LAYOUT UTILITIES
// ============================================================================

/**
 * Checks if we're near the end of the page
 */
function checkEndOfPage(doc: PDFType, y: number, extra = 0): boolean {
    return (doc.page.height - y) < ONE_INCH + extra;
}

/**
 * Adds a new page if needed and returns the new y position
 */
function addPageIfNeeded(doc: PDFType, y: number, extra = 0): number {
    if (checkEndOfPage(doc, y, extra)) {
        doc.addPage(PAGE_OPTIONS);
        return ONE_INCH;
    }
    return y;
}

// ============================================================================
// TITLE PAGE RENDERING
// ============================================================================

/**
 * Creates a subtitle section with header and sub-text
 */
function createSubtitle(doc: PDFType, headText: string, subText: string): void {
    doc.font("Regular")
        .fontSize(FONT_SIZES.SUBTITLE)
        .fillColor([0, 0, 0])
        .text(headText, { align: 'center', features: getTextFeatures(headText) });
    
    doc.moveDown(0.1);
    
    doc.fontSize(FONT_SIZES.SUBTITLE * 0.8)
        .fillColor([100, 100, 100])
        .text(subText, { align: 'center', features: getTextFeatures(subText) });
}

/**
 * Creates a writers subtitle with multiple writers listed separately
 */
function createWritersSubtitle(doc: PDFType, headText: string, subText: string): void {
    doc.font("Regular")
        .fontSize(FONT_SIZES.SUBTITLE)
        .fillColor([0, 0, 0])
        .text(headText, { align: 'center', features: getTextFeatures(headText) });

    const writers = subText.split(',').map(writer => writer.trim());
    for (const writer of writers) {
        doc.moveDown(0.1);
        doc.fontSize(FONT_SIZES.SUBTITLE * 0.8)
            .fillColor([100, 100, 100])
            .text(writer, { align: 'center', features: getTextFeatures(writer) });
    }
}

/**
 * Renders the title page of the script
 */
function renderTitlePage(doc: PDFType, script: Script): void {
    doc.addPage(PAGE_OPTIONS);
    doc.y = doc.page.height / 2 - FONT_SIZES.TITLE * 2;
    
    // Main title
    const title = script.metadata.title || "Untitled script";
    doc.font("Bold")
        .fontSize(FONT_SIZES.TITLE)
        .text(title, { align: 'center', features: getTextFeatures(title) });

    // Subtitle (if exists)
    if (script.metadata.subtitle) {
        doc.font("Regular")
            .fontSize(FONT_SIZES.TITLE * 0.6)
            .text(script.metadata.subtitle, { align: 'center', features: getTextFeatures(script.metadata.subtitle) });
    }
    
    // Writers
    doc.moveDown(2);
    createWritersSubtitle(doc, 
        i18nPDF.t("pdf.writtenBy"), (script.metadata.writers == "inherit") 
        ? "inherit" 
        : script.metadata.writers.join(", ") || "Unknown Writer"
    );

    // Production company (if exists)
    if (script.metadata.prodCompany) {
        doc.moveDown(1);
        createSubtitle(doc, i18nPDF.t("pdf.producedBy"), script.metadata.prodCompany);
    }

    // Date (if exists)
    if (script.metadata.date) {
        doc.moveDown(1);
        const formattedDate = new Date(script.metadata.date).toLocaleDateString(i18nPDF.getCurrentLanguage());
        createSubtitle(doc, i18nPDF.t("pdf.date"), formattedDate);
    }
}

// ============================================================================
// SCRIPT ELEMENT RENDERERS
// ============================================================================

/**
 * Renders an action element
 */
async function renderAction(content: string, doc: PDFType): Promise<void> {
    const align = isRTL(content) ? "right" : "left";
    
    doc.font("Regular")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(prepareTextForPDF(content), { 
            align, 
            features: getTextFeatures(content),
            width: doc.page.width - ONE_INCH * 2,
        });
}

/**
 * Renders a character name
 */
function renderCharacter(content: string, doc: PDFType): void {
    const name = content.trim().toUpperCase();
    
    doc.font("Bold")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(prepareTextForPDF(name), { 
            align: "center", 
            features: getTextFeatures(name),
        });
}

/**
 * Renders dialogue text
 */
function renderDialogue(content: string, doc: PDFType): void {
    let isCentered = false;
    
    // Check if dialogue is centered (starts with quote)
    if (content.startsWith("\"")) {
        isCentered = true;
        content = content.slice(1);
    }
    
    const align = isCentered ? "center" : (isRTL(content) ? "right" : "left");
    const formattedContent = prepareTextForPDF(content);
    
    // Center the dialogue box horizontally
    doc.x = (doc.page.width - DIMENSIONS.DIALOGUE_BOX_WIDTH) / 2;
    
    doc.font("Regular")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(formattedContent, {
            align,
            features: getTextFeatures(formattedContent),
            width: DIMENSIONS.DIALOGUE_BOX_WIDTH,
        });
    
    // Reset x position for next element
    doc.x = ONE_INCH;
}

/**
 * Renders a transition
 */
function renderTransition(content: string, doc: PDFType): void {
    const text = content.toUpperCase();
    const align = isRTL(content) ? "left" : "right";
    
    doc.font("Bold")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(prepareTextForPDF(text), { 
            align, 
            features: getTextFeatures(text),
            width: doc.page.width - ONE_INCH * 2,
        });
}

/**
 * Renders a subheader
 */
function renderSubheader(content: string, doc: PDFType): void {
    const text = prepareTextForPDF(content);
    const align = isRTL(content) ? "right" : "left";
    
    doc.font("Bold")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(text.toUpperCase(), { 
            align, 
            features: getTextFeatures(text),
            width: doc.page.width - ONE_INCH * 2,
        });
}

/**
 * Routes script element to appropriate renderer
 */
function renderElement(element: ScriptElement, doc: PDFType): void {
    switch (element.type) {
        case ScriptElementType.Action:
            renderAction(element.content, doc);
            break;
        case ScriptElementType.Character:
            renderCharacter(element.content, doc);
            break;
        case ScriptElementType.Dialogue:
            renderDialogue(element.content, doc);
            break;
        case ScriptElementType.Transition:
            renderTransition(element.content, doc);
            break;
        case ScriptElementType.Subheader:
            renderSubheader(element.content, doc);
            break;
    }
}

// ============================================================================
// SCENE RENDERING
// ============================================================================

/**
 * Renders scene heading with scene number on both sides
 */
function renderSceneHeading(doc: PDFType, heading: string, sceneNumber: number, y: number): void {
    const upperText = heading.toUpperCase();
    const sceneNumStr = `${sceneNumber}`;
    
    doc.font("Bold")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0]);

    // Render scene number on left
    doc.text(
        sceneNumStr,
        (ONE_INCH - doc.widthOfString(sceneNumStr)) / 2,
        y,
        { align: 'left', features: getTextFeatures(upperText) }
    );
    
    // Render scene number on right
    doc.text(
        sceneNumStr,
        doc.page.width - doc.widthOfString(sceneNumStr) - ONE_INCH / 2,
        y,
        { align: 'right', features: getTextFeatures(upperText) }
    );

    // Render the heading
    const align = isRTL(heading) ? "right" : "left";
    doc.text(upperText, ONE_INCH, y, { 
        align, 
        features: getTextFeatures(upperText) 
    });
}

/**
 * Renders a complete scene
 */
function renderScene(scene: Scene, doc: PDFType, y: number): number {
    // Add page if needed for scene heading
    y = addPageIfNeeded(doc, y, FONT_SIZES.TITLE);
    
    // Render scene heading and add to outline
    if (scene.id > 0) {
        renderSceneHeading(doc, scene.heading, scene.id, y);
        doc.outline.addItem(scene.heading, { expanded: true });
    }
    
    // Handle first element if it's a subheader
    let startIndex = 0;
    if (scene.elements.length > 0 && scene.elements[0].type === ScriptElementType.Subheader) {
        renderSubheader(scene.elements[0].content, doc);
        startIndex = 1;
    }

    // Render remaining elements
    for (let i = startIndex; i < scene.elements.length; i++) {
        // Add spacing between different element types
        if (i === startIndex || scene.elements[i - 1].type !== scene.elements[i].type) {
            doc.moveDown(0.5);
        }
        
        renderElement(scene.elements[i], doc);

        // Check if we need a new page
        if (checkEndOfPage(doc, doc.y, 0)) {
            doc.addPage(PAGE_OPTIONS);
        }
    }

    return doc.y;
}

/**
 * Renders all scenes in the script
 */
async function renderScript(doc: PDFType, script: Script): Promise<void> {
    let y = ONE_INCH;
    
    for (const scene of script.scenes) {
        y = renderScene(scene, doc, y);
        y += 0.5 * FONT_SIZES.DEFAULT;
    }
}

// ============================================================================
// MAIN PDF CREATION
// ============================================================================

/**
 * Initializes fonts for the PDF document using bundled base64 fonts
 */
function initializeFonts(doc: PDFType, language: string): void {
    const isHebrew = language === "he";
    
    const regularBuffer = (isHebrew ? AlefRegular : CourierRegular);
    const boldBuffer = (isHebrew ? AlefBold : CourierBold);
    
    doc.registerFont("Regular", Buffer.from(regularBuffer.split(",")[1], 'base64'));
    doc.registerFont("Bold", Buffer.from(boldBuffer.split(",")[1], 'base64'));
    doc.font("Regular").fontSize(FONT_SIZES.DEFAULT);
}
/**
 * Creates and exports a PDF from a script
 */
export async function createPDF(script: Script): Promise<void> {
    // Detect language and configure i18n
    const detectedLanguage = I18n.detectLanguage(
        script.metadata.title || 
        (typeof script.metadata.writers === "string" 
            ? '' 
            : script.metadata.writers.join(", ")) || ''
    );
    i18nPDF.setLanguage(detectedLanguage);
    
    // Create PDF document
    const doc = new PDFDocument({ 
        ...BASE_PAGE_OPTIONS, 
        lang: i18nPDF.getCurrentLanguage(),
        autoFirstPage: false,
    });
    const outputStream = doc.pipe(blobStream());

    // Initialize fonts
    initializeFonts(doc, i18nPDF.getCurrentLanguage());

    // Render title page
    renderTitlePage(doc, script);

    // Render script content
    doc.addPage(PAGE_OPTIONS);
    await renderScript(doc, script);

    // Finalize and export
    doc.end();
    outputStream.on("finish", () => {
        const blob = outputStream.toBlob('application/pdf');
        const fileName = `${script.metadata.title || "Untitled script"}.pdf`;
        saveAs(blob, fileName);
    });
}