import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Scene, Script, ScriptElement, ScriptElementType } from './scriptParser';

const LETTER_WIDTH = 612.4; // 8.5 inches in points
const LETTER_HEIGHT = 791; // 11 inches in points
const ONE_INCH = 72; // 1 inch in points
const TITLE_FONT_SIZE = 36;
const SUBTITLE_FONT_SIZE = 14;
const DEFAULT_FONT_SIZE = 12;

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
): number
{
    const spacing = 24;
    const isHebrew = /[\u0590-\u05FF]/.test(heading);
    const numberText = `${sceneNumber}`;
    const fullText = isHebrew ? `${heading}\t${numberText}` : `${numberText}\t${heading}`;
    const upperText = fullText.toUpperCase();

    const textWidth = fontBold.widthOfTextAtSize(upperText, DEFAULT_FONT_SIZE);
    const x = isHebrew ? pageWidth - textWidth - ONE_INCH : ONE_INCH;

    page.drawText(upperText, {
        x,
        y,
        font: fontBold,
        size: DEFAULT_FONT_SIZE,
        color: rgb(0, 0, 0),
    });

    return y - spacing; // Return the updated Y position after rendering the scene heading
}

function renderScene(scene: Scene, doc: PDFDocument, y: number, fontRegular: PDFFont, fontBold: PDFFont): { page: PDFPage, y: number } 
{
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

    y = renderSceneHeading(scene.heading, page, y, fontBold, scene.id);

    var result: { y: number, pageBreak: boolean, nextPageContent?: string } = { y, pageBreak: false, nextPageContent: undefined };
    for (const element of scene.elements) 
    {
        
        result = renderElement(element, page, y, fontRegular, fontBold);
        y = result.y;

        while (result.pageBreak)
        {
            element.content = result.nextPageContent || "";
            addNewPage();
            
            if (result.nextPageContent)
            {
                result = renderElement(element, page, y, fontRegular, fontBold);
                y = result.y;
            }
        }

        if (checkPageBreak(y))
            addNewPage();
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

export async function createPDF(fontBytesRegular: Uint8Array, fontBytesBold: Uint8Array, script: Script) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);

    const fontkitInstance = fontkit;
    pdfDoc.registerFontkit(fontkitInstance);

    const fontRegular = await pdfDoc.embedFont(fontBytesRegular);
    const fontBold = await pdfDoc.embedFont(fontBytesBold);

    const { width, height } = page.getSize();

    // === Layout ===
    const titleSize = TITLE_FONT_SIZE;
    const subtitleSize = SUBTITLE_FONT_SIZE;
    const lineSpacing = 50;

    // Compute Y position for center alignment
    let y = height / 2 + lineSpacing;

    // Draw title
    const titleWidth = fontBold.widthOfTextAtSize(script.title, titleSize);
    page.drawText(script.title, {
        x: (width - titleWidth) / 2,
        y,
        font: fontBold,
        size: titleSize,
        color: rgb(0, 0, 0),
    });

    // Draw subtitle if it exists
    if (script.subtitle) {
        y -= lineSpacing / 2;
        const subtitleWidth = fontRegular.widthOfTextAtSize(script.subtitle, titleSize * 0.5);
        page.drawText(script.subtitle, {
            x: (width - subtitleWidth) / 2,
            y,
            font: fontRegular,
            size: titleSize * 0.5,
            color: rgb(0.2, 0.2, 0.2),
        });
    }

    // Draw author
    y -= lineSpacing;
    y -= createWritersSubtitle(page, fontRegular, subtitleSize, "written by", script.writers, width, y);

    // Draw production company
    if (script.prod_company) {
        createSubtitle(page, fontRegular, subtitleSize, "produced by", script.prod_company, width, y);
        y -= lineSpacing;
    }

    // Draw date
    const date = new Date(script.date);
    createSubtitle(page, fontRegular, subtitleSize, "date", `${date.getDay()}.${date.getMonth()}.${date.getFullYear()}`, width, y);

    // Script Content
    renderScript(pdfDoc, fontRegular, fontBold, script);

    // Save and download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, "Script.pdf");
}