import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// @ts-ignore
import { saveAs } from 'file-saver';
import { Script } from './scriptParser';

function createWritersSubtitle(page: any, font: any, fontSize: number, headText: string, subText: string, pageWidth: number, y: number): number
{
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

function createSubtitle(page: any, font: any, fontSize: number, headText: string, subText: string, pageWidth: number, y: number) 
{
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

export async function createPDF(fontBytesRegular: Uint8Array, fontBytesBold: Uint8Array, script: Script) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612.4, 791]); // letter size in points (8.5 x 11 inches)

    const fontkitInstance = fontkit;
    pdfDoc.registerFontkit(fontkitInstance);

    const fontRegular = await pdfDoc.embedFont(fontBytesRegular);
    const fontBold = await pdfDoc.embedFont(fontBytesBold);

    const { width, height } = page.getSize();

    // === Layout ===
    const titleSize = 36;
    const subtitleSize = 14;
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
    if (script.prod_company)
    {
        createSubtitle(page, fontRegular, subtitleSize, "produced by", script.prod_company, width, y);
        y -= lineSpacing;
    }

    // Draw date
    const date = new Date(script.date);
    createSubtitle(page, fontRegular, subtitleSize, "date", `${date.getDay()}.${date.getMonth()}.${date.getFullYear()}`, width, y);


    // Save and download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, "Script.pdf");
}