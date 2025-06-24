import PDFDocument from "pdfkit";
import blobStream from 'blob-stream';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Scene, Script, ScriptElement, ScriptElementType } from './scriptParser';
import { I18n, i18nPDF, isRTL } from './i18n/i18n';

const ONE_INCH = 72; // 1 inch in points
const PAGE_OPTIONS: PDFKit.PDFDocumentOptions = {
    size: "LETTER",
    margin: ONE_INCH,
    autoFirstPage: false
}
const TITLE_FONT_SIZE = 36;
const SUBTITLE_FONT_SIZE = 14;
const DEFAULT_FONT_SIZE = 12;
type PDFType = typeof PDFDocument

function fixParenthesesInRTL(text: string): string 
{
    if (!isRTL(text)) return text;
    text = text.replace(/\(([^)]+)\)/g, (_match, inner) => `)${inner}(`); // Swap regular parentheses in RTL text
    text = text.replace(/(\[)([^\]]+)(\])/g, (_match, open, inner, close) => `${close}${inner}${open}`); // Swap square brackets in RTL text
    text = text.replace(/(\{)([^\}]+)(\})/g, (_match, open, inner, close) => `${close}${inner}${open}`); // Swap curly braces in RTL text
    return text;
}

function formatTextForLTRLangsPDF(text: string): string 
{
    // Wrap LTR parts (numbers, English) with LTR markers
    return text.replace(/\d+/g, (match) => match.split('').reverse().join(''));
}

function checkEndOfPage(doc: PDFType, y: number, extra: number): boolean
{
    // Check if the current y position is close to the bottom of the page
    return (doc.page.height - y) < ONE_INCH + extra;
}

function getTextFeatures(text: string): PDFKit.Mixins.OpenTypeFeatures[]
{
    return isRTL(text) ? ["rtla"] : []
}

function createWritersSubtitle(doc: PDFType, headText: string, subText: string)
{
    doc.font("Regular").fontSize(SUBTITLE_FONT_SIZE).fillColor([0, 0, 0]).text(
        headText,
        { align: 'center', features: getTextFeatures(headText) }
    );

    const writers = subText.split(',').map(writer => writer.trim());
    for (const writer of writers) {
        doc.moveDown(0.1); // Add some space after each writer
        doc.fontSize(SUBTITLE_FONT_SIZE * 0.8).fillColor([100, 100, 100]).text(
            writer,
            { align: 'center', features: getTextFeatures(writer) }
        );
    }
}

function createSubtitle(doc: PDFType, headText: string, subText: string) {
    doc.font("Regular").fontSize(SUBTITLE_FONT_SIZE).fillColor([0, 0, 0]).text(
        headText,
        { align: 'center', features: getTextFeatures(headText) }
    );
    doc.moveDown(0.1); // Add some space after the subtitle
    doc.fontSize(SUBTITLE_FONT_SIZE * 0.8).fillColor([100, 100, 100]).text(
        subText,
        { align: 'center', features: getTextFeatures(subText) }
    );
}

function renderAction(content: string, doc: PDFType)
{
    doc.font("Regular").fontSize(DEFAULT_FONT_SIZE).fillColor([0, 0, 0]);
    doc.text(
        isRTL(content) ? formatTextForLTRLangsPDF(fixParenthesesInRTL(content)) : content,
        { 
            align: isRTL(content) ? "right" : "left", 
            features: getTextFeatures(content),
            width: doc.page.width - ONE_INCH * 2, // Leave margins on both sides
        }
    )
}

function renderCharacter(content: string, doc: PDFType)
{
    const name = content.trim().toUpperCase();
    doc.font("Bold").fontSize(DEFAULT_FONT_SIZE).fillColor([0, 0, 0]);
    doc.text(
        isRTL(name) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(name)) : name,
        { 
            align: "center", 
            features: getTextFeatures(name),
        }
    )
}

function renderDialogue(content: string, doc: PDFType)
{
    const blockWidth = 200; // Width of the dialogue box
    const formattedContent = isRTL(content) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(content)) : content;

    doc.font("Regular").fontSize(DEFAULT_FONT_SIZE).fillColor([0, 0, 0]);
    doc.text(
        formattedContent,
        {
            align: isRTL(content) ? "right" : "left",
            features: getTextFeatures(formattedContent),
            width: doc.page.width - ONE_INCH * 2 - (doc.page.width - blockWidth), // Leave margins and space for the block
        }
    );
}

//function renderTransition(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
//    const text = content.toUpperCase();
//    const textWidth = font.widthOfTextAtSize(text, DEFAULT_FONT_SIZE);
//    const x = i18nPDF.getTextPosition(text, textWidth, LETTER_WIDTH, ONE_INCH);
//
//    const formattedContent = isRTL(text) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(text)) : text;
//    page.drawText(formattedContent, {
//        x,
//        y,
//        font,
//        size: DEFAULT_FONT_SIZE,
//        color: rgb(0, 0, 0),
//    });
//
//    return { y: y - LINE_SPACING, pageBreak: false };
//}
//
//function renderSubheader(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
//    const safeContent = isRTL(content) ?  fixParenthesesInRTL(formatTextForLTRLangsPDF(content)) : content;
//    const textWidth = font.widthOfTextAtSize(safeContent, DEFAULT_FONT_SIZE);
//    const x = i18nPDF.getTextPosition(safeContent, textWidth, LETTER_WIDTH, ONE_INCH);
//
//    
//    page.drawText(safeContent, {
//        x,
//        y,
//        font,
//        size: DEFAULT_FONT_SIZE,
//        color: rgb(0, 0, 0),
//    });
//
//    return { y: y - LINE_SPACING, pageBreak: false };
//}

function renderElement(element: ScriptElement, doc: PDFType) 
{
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
            //renderTransition(element.content, doc);
            break;
        case ScriptElementType.Subheader:
            //renderSubheader(element.content, doc);
            break;
        default:
            break;
    }
}

function renderSceneHeading(doc: PDFType, heading: string, sceneNumber: number, y: number) 
{
    const upperText = heading.toUpperCase();

    doc.font("Bold").fontSize(DEFAULT_FONT_SIZE).fillColor([0, 0, 0]);

    // render the number
    doc.text(`${sceneNumber}`,
        (ONE_INCH - doc.widthOfString(`${sceneNumber}`)) / 2, // Center the number
        y,
        { align: 'left', features: getTextFeatures(upperText) }
    );
    doc.text(`${sceneNumber}`,
        doc.page.width - doc.widthOfString(`${sceneNumber}`) - ONE_INCH / 2, // Right align the number
        y,
        { align: 'right', features: getTextFeatures(upperText) }
    );

    // render the heading
    doc.text(upperText,
        ONE_INCH, // Add some space after the number
        y,
        { align: isRTL(heading) ? "right" : "left", features: getTextFeatures(upperText) }
    );
}

function renderScene(scene: Scene, doc: PDFType, y: number): number 
{
    if (checkEndOfPage(doc, y, TITLE_FONT_SIZE))
    {
        doc.addPage();
        y = 0;
    }

    if (scene.id > 0)
    {
        renderSceneHeading(doc, scene.heading, scene.id, y);
        const { outline } = doc;
        outline.addItem(scene.heading, { expanded: true });
    }

    for (const element of scene.elements)
    {
        renderElement(element, doc);
        doc.moveDown(0.5); // Add some space after each element

        if (checkEndOfPage(doc, doc.y, 0))
        {
            doc.addPage();
            y = ONE_INCH; // Reset y position for the new page
        }
    }

    return doc.y;
}

async function renderScript(doc: PDFType, script: Script) 
{
    var y = ONE_INCH; // Start at the top of the page
    for (const scene of script.scenes) 
    {
        y = renderScene(scene, doc, y);
        doc.moveDown(2); // Add some space after each scene
    }
}

export async function createPDF(regularFontPath: string, boldFontPath: string, script: Script) 
{
    // setting the language for the pdf
    const detectedLanguage = I18n.detectLanguage(script.title || script.writers || '');
    i18nPDF.setLanguage(detectedLanguage);
    
    // Create a new PDF document
    const doc = new PDFDocument({ ...PAGE_OPTIONS, lang: i18nPDF.getCurrentLanguage(), font: regularFontPath });
    const outputStream = doc.pipe(blobStream());

    // Load the fonts
    doc.registerFont("Regular", regularFontPath);
    doc.registerFont("Bold", boldFontPath);
    doc.font("Regular").fontSize(DEFAULT_FONT_SIZE);

    // Title page
    doc.addPage();
    doc.y = doc.page.height / 2 - TITLE_FONT_SIZE; // Center vertically
    
    doc.font("Bold").fontSize(TITLE_FONT_SIZE).text(
        script.title || "Untitled Script",
        { align: 'center', features: getTextFeatures(script.title || "Untitled Script") }
    );

    if (script.subtitle) {
        doc.font("Regular").fontSize(TITLE_FONT_SIZE * 0.6).text(
            script.subtitle,
            { align: 'center', features: getTextFeatures(script.subtitle) }
        );
    }
    
    doc.moveDown(2); // Add some space after the title
    createWritersSubtitle(doc, i18nPDF.t("pdf.writtenBy"), script.writers || "Unknown Writer");

    if (script.prod_company) {
        doc.moveDown(1); // Add some space before the production company
        createSubtitle(doc, i18nPDF.t("pdf.producedBy"), script.prod_company);
    }

    if (script.date) {
        doc.moveDown(1); // Add some space before the date
        createSubtitle(doc, i18nPDF.t("pdf.date"), new Date(script.date).toLocaleDateString(i18nPDF.getCurrentLanguage()));
    }

    // render scenes
    doc.addPage();
    renderScript(doc, script);

    // Export PDF
    doc.end();
    outputStream.on("finish", () => {
        const blob = outputStream.toBlob('application/pdf');
        saveAs(blob, `${script.title || "Untitled Script"}.pdf`);
    });
}