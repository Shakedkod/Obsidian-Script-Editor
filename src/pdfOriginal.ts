import { PDFDocument, PDFFont, PDFName, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Scene, Script, ScriptElement, ScriptElementType } from './scriptParser';
import { I18n, i18nPDF, isRTL } from './i18n/i18n';
import path from 'path';

const LETTER_WIDTH = 612.4; // 8.5 inches in points
const LETTER_HEIGHT = 791; // 11 inches in points
const ONE_INCH = 72; // 1 inch in points
const LINE_SPACING = 18; // Default line spacing in points
const TITLE_FONT_SIZE = 36;
const SUBTITLE_FONT_SIZE = 14;
const DEFAULT_FONT_SIZE = 12;

const sceneBookmarks: { title: string; page: number }[] = [];

function createWritersSubtitle(page: any, font: any, fontSize: number, headText: string, subText: string, pageWidth: number, y: number): number {
    // Draw the heading
    const headWidth = font.widthOfTextAtSize(headText, fontSize);
    page.drawText(headText, {
        x: (pageWidth - headWidth) / 2,
        y,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
    });

    // Draw the writers
    const writers = subText.split(",").map((writer: string) => writer.trim());
    const subTextLines = writers.map((writer: string) => {
        const subWidth = font.widthOfTextAtSize(writer, fontSize * 0.8);
        return {
            text: writer,
            width: subWidth
        };
    });

    let currentY = y - 15; // Adjust the Y position for the subheading
    subTextLines.forEach((line, index) => {
        page.drawText(line.text, {
            x: (pageWidth - line.width) / 2,
            y: currentY,
            font: font,
            size: fontSize * 0.8,
            color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 15; // Move down for the next writer
    });

    return subTextLines.length * 10 + 50; // Return the total height used for the writers
}

function createSubtitle(page: any, font: any, fontSize: number, headText: string, subText: string, pageWidth: number, y: number) {
    const headWidth = font.widthOfTextAtSize(headText, fontSize);
    const subWidth = font.widthOfTextAtSize(subText, fontSize * 0.8);

    // Draw the heading
    page.drawText(headText, {
        x: (pageWidth - headWidth) / 2,
        y,
        font: font,
        size: fontSize,
        color: rgb(0, 0, 0),
    });

    // Draw the subheading below the heading
    page.drawText(subText, {
        x: (pageWidth - subWidth) / 2,
        y: y - 15, // Adjust the Y position for the subheading
        font: font,
        size: fontSize * 0.8,
        color: rgb(0.2, 0.2, 0.2),
    });
}

interface ReturnArgs {
    y: number;
    pageBreak: boolean;
    nextPageContent?: string;
}

function formatTextForLTRLangsPDF(text: string): string 
{
    // Wrap LTR parts (numbers, English) with LTR markers
    return text.replace(/\d+/g, (match) => match.split('').reverse().join(''));
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        const width = font.widthOfTextAtSize(test, size);

        if (width <= maxWidth)
            current = test;
        else {
            if (current) lines.push(current);
            current = word; // Start a new line with the current word
        }
    }

    if (current) lines.push(current); // Add the last line if it exists
    return lines;
}

function fixParenthesesInRTL(text: string): string {
    if (!isRTL(text)) return text;
    text = text.replace(/\(([^)]+)\)/g, (_match, inner) => `)${inner}(`); // Swap regular parentheses in RTL text
    text = text.replace(/(\[)([^\]]+)(\])/g, (_match, open, inner, close) => `${close}${inner}${open}`); // Swap square brackets in RTL text
    text = text.replace(/(\{)([^\}]+)(\})/g, (_match, open, inner, close) => `${close}${inner}${open}`); // Swap curly braces in RTL text
    return text;
}

function renderAction(content: string, page: PDFPage, y: number, font: PDFFont, pageWidth: number = LETTER_WIDTH): ReturnArgs {
    const maxWith = pageWidth - 2 * ONE_INCH; // Leave margins
    const maxLinesPerPage = Math.floor((y - ONE_INCH) / LINE_SPACING);

    const formattedContent = isRTL(content) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(content)) : content;
    const lines = wrapText(formattedContent, font, DEFAULT_FONT_SIZE, maxWith);

    if (lines.length <= maxLinesPerPage) {
        for (const line of lines) {
            const textWidth = font.widthOfTextAtSize(line, DEFAULT_FONT_SIZE);
            page.drawText(line, {
                x: i18nPDF.getTextPosition(line, textWidth, pageWidth, ONE_INCH),
                y,
                font,
                size: DEFAULT_FONT_SIZE,
                color: rgb(0, 0, 0),
            });
            y -= LINE_SPACING; // Move down for the next line
        }

        return { y, pageBreak: false };
    }

    const fittingLines = lines.slice(0, maxLinesPerPage);
    const remainingLines = lines.slice(maxLinesPerPage);

    for (const line of fittingLines) {
        const textWidth = font.widthOfTextAtSize(line, DEFAULT_FONT_SIZE);
        page.drawText(line, {
            x: i18nPDF.getTextPosition(line, textWidth, pageWidth, ONE_INCH),
            y,
            font,
            size: DEFAULT_FONT_SIZE,
            color: rgb(0, 0, 0),
        });
        y -= LINE_SPACING; // Move down for the next line
    }

    return {
        y,
        pageBreak: true,
        nextPageContent: remainingLines.join(' ')
    };
}

function renderCharacter(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
    const name = content.trim().toUpperCase();
    const textWidth = font.widthOfTextAtSize(name, DEFAULT_FONT_SIZE);
    const x = (LETTER_WIDTH - textWidth) / 2;

    const formattedContent = isRTL(name) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(name)) : name;
    page.drawText(formattedContent, {
        x,
        y,
        size: DEFAULT_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
    });

    return { y: y - LINE_SPACING, pageBreak: false };
}

function renderDialogue(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
    const blockWidth = 200; // Width of the dialogue box
    const maxLines = Math.floor((y - ONE_INCH) / LINE_SPACING);

    const formattedContent = isRTL(content) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(content)) : content;
    console.log("Formatted content for dialogue:", formattedContent);
    const lines = wrapText(formattedContent, font, DEFAULT_FONT_SIZE, blockWidth);

    if (lines.length <= maxLines) {
        for (const line of lines) {
            const textWidth = font.widthOfTextAtSize(line, DEFAULT_FONT_SIZE);
            const x = isRTL(content)
                ? (LETTER_WIDTH + blockWidth) / 2 - textWidth // right-aligned inside block
                : (LETTER_WIDTH - blockWidth) / 2;
            page.drawText(line, { x, y, size: DEFAULT_FONT_SIZE, font, color: rgb(0, 0, 0) });
            y -= LINE_SPACING;
        }
        return { y, pageBreak: false };
    }

    const fitting = lines.slice(0, maxLines);
    const remaining = lines.slice(maxLines);

    for (const line of fitting) {
        const textWidth = font.widthOfTextAtSize(line, DEFAULT_FONT_SIZE);
        const x = isRTL(content)
            ? (LETTER_WIDTH + blockWidth) / 2 - textWidth // right-aligned inside block
            : (LETTER_WIDTH - blockWidth) / 2;
        page.drawText(line, { x, y, size: DEFAULT_FONT_SIZE, font, color: rgb(0, 0, 0) });
        y -= LINE_SPACING;
    }

    return {
        y,
        pageBreak: true,
        nextPageContent: remaining.join(' ')
    };
}

function renderTransition(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
    const text = content.toUpperCase();
    const textWidth = font.widthOfTextAtSize(text, DEFAULT_FONT_SIZE);
    const x = i18nPDF.getTextPosition(text, textWidth, LETTER_WIDTH, ONE_INCH);

    const formattedContent = isRTL(text) ? fixParenthesesInRTL(formatTextForLTRLangsPDF(text)) : text;
    page.drawText(formattedContent, {
        x,
        y,
        font,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });

    return { y: y - LINE_SPACING, pageBreak: false };
}

function renderSubheader(content: string, page: PDFPage, y: number, font: PDFFont): ReturnArgs {
    const safeContent = isRTL(content) ?  fixParenthesesInRTL(formatTextForLTRLangsPDF(content)) : content;
    const textWidth = font.widthOfTextAtSize(safeContent, DEFAULT_FONT_SIZE);
    const x = i18nPDF.getTextPosition(safeContent, textWidth, LETTER_WIDTH, ONE_INCH);

    
    page.drawText(safeContent, {
        x,
        y,
        font,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });

    return { y: y - LINE_SPACING, pageBreak: false };
}

function renderElement(element: ScriptElement, page: PDFPage, y: number, fontRegular: PDFFont, fontBold: PDFFont): { y: number, pageBreak: boolean, nextPageContent?: string } {
    switch (element.type) {
        case ScriptElementType.Action:
            return renderAction(element.content, page, y, fontRegular);
        case ScriptElementType.Character:
            return renderCharacter(element.content, page, y, fontBold);
        case ScriptElementType.Dialogue:
            return renderDialogue(element.content, page, y, fontRegular);
        case ScriptElementType.Transition:
            return renderTransition(element.content, page, y, fontRegular);
        case ScriptElementType.Subheader:
            return renderSubheader(element.content, page, y, fontBold);
        default:
            return { y, pageBreak: false };
    }
}

function renderSceneHeading(
    heading: string,
    page: PDFPage,
    y: number,
    fontBold: PDFFont,
    sceneNumber: number = 0,
    pageWidth: number = LETTER_WIDTH
): number {
    const numberText = `${sceneNumber}`;
    const upperText = heading.toUpperCase();

    const numberWidth = fontBold.widthOfTextAtSize(numberText, DEFAULT_FONT_SIZE);
    page.drawText(numberText, {
        x: ONE_INCH - numberWidth - 10, // 10 points padding from margin edge
        y,
        font: fontBold,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });
    page.drawText(numberText, {
        x: pageWidth - ONE_INCH + 10, // 10 points padding from margin edge
        y,
        font: fontBold,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });

    const textWidth = fontBold.widthOfTextAtSize(upperText, DEFAULT_FONT_SIZE);
    const x = i18nPDF.getTextPosition(heading, textWidth, pageWidth, ONE_INCH);

    page.drawText(upperText, {
        x,
        y,
        font: fontBold,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });
    
    return y - LINE_SPACING; // Return the updated Y position after rendering the scene heading
}

function renderScene(scene: Scene, doc: PDFDocument, y: number, fontRegular: PDFFont, fontBold: PDFFont): { page: PDFPage, y: number } {
    let page = doc.getPage(doc.getPageCount() - 1); // Get the last page
    const checkPageBreak = (y: number): boolean => y < ONE_INCH;

    // Helper to create new page
    const addNewPage = () => {
        const newPage = doc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
        y = newPage.getHeight() - ONE_INCH; // Reset Y position for the new page
        page = newPage;
    };

    y -= 30; // Add some space before the scene heading
    if (checkPageBreak(y)) addNewPage();

    if (scene.id > 0)
    {
        y = renderSceneHeading(scene.heading, page, y, fontBold, scene.id);
        sceneBookmarks.push({ title: scene.heading, page: doc.getPageCount() - 1 });
    }

    for (const element of scene.elements) {
        let content = element.content;
        let result: { y: number; pageBreak: boolean; nextPageContent?: string };

        do {
            result = renderElement({ ...element, content }, page, y, fontRegular, fontBold);
            y = result.y;

            if (result.pageBreak) {
                addNewPage();
                content = result.nextPageContent || "";
            }
        } while (result.pageBreak);

        if (checkPageBreak(y)) addNewPage();
    }

    return { page, y };
}

async function renderScript(pdfDoc: PDFDocument, fontRegular: PDFFont, fontBold: PDFFont, script: Script) {
    let page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
    let y = page.getHeight() - ONE_INCH; // Start from the top of the page

    for (const scene of script.scenes) {
        const result = renderScene(scene, pdfDoc, y, fontRegular, fontBold);
        page = result.page;
        y = result.y;
    }
}

export async function createPDF(fontBytesRegular: Uint8Array, fontBytesBold: Uint8Array, script: Script) 
{
    const detectedLanguage = I18n.detectLanguage(script.title || script.writers || '');
    i18nPDF.setLanguage(detectedLanguage);
    sceneBookmarks.length = 0; // Reset bookmarks for each PDF generation

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);

    const fontkitInstance = fontkit;
    pdfDoc.registerFontkit(fontkitInstance);

    const fontRegular = await pdfDoc.embedFont(fontBytesRegular);
    const fontBold = await pdfDoc.embedFont(fontBytesBold);

    const { width, height } = page.getSize();

    // === Layout ===
    const lineSpacing = 50;

    // Compute Y position for center alignment
    let y = height / 2 + lineSpacing;

    // Draw title
    const titleWidth = fontBold.widthOfTextAtSize(script.title, TITLE_FONT_SIZE);
    page.drawText(script.title, {
        x: (width - titleWidth) / 2,
        y,
        font: fontBold,
        size: TITLE_FONT_SIZE,
        color: rgb(0, 0, 0),
    });

    // Draw subtitle if it exists
    if (script.subtitle) {
        y -= lineSpacing / 2;
        const subtitleWidth = fontRegular.widthOfTextAtSize(script.subtitle, TITLE_FONT_SIZE * 0.5);
        page.drawText(script.subtitle, {
            x: (width - subtitleWidth) / 2,
            y,
            font: fontRegular,
            size: TITLE_FONT_SIZE * 0.5,
            color: rgb(0.2, 0.2, 0.2),
        });
    }

    // Draw author
    y -= lineSpacing;
    y -= createWritersSubtitle(
        page, 
        fontRegular, 
        SUBTITLE_FONT_SIZE, 
        i18nPDF.t('pdf.writtenBy'), 
        script.writers, 
        width,
        y
    );

    // Draw production company
    if (script.prod_company) {
        createSubtitle(
            page, 
            fontRegular, 
            SUBTITLE_FONT_SIZE, 
            i18nPDF.t('pdf.producedBy'), 
            script.prod_company, 
            width, 
            y
        );
        y -= lineSpacing;
    }

    // Draw date
    const date = new Date(script.date);
    createSubtitle(
        page, 
        fontRegular, 
        SUBTITLE_FONT_SIZE,
        i18nPDF.t('pdf.date'), 
        `${date.getDay()}.${date.getMonth()}.${date.getFullYear()}`, 
        width, 
        y
    );

    // Script Content
    renderScript(pdfDoc, fontRegular, fontBold, script);

    // Save and download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, "Script.pdf");
}