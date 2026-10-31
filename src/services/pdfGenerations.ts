import "./pdfkitPatch";
import PDFDocument from "pdfkit";
import blobStream from "blob-stream";
import { Scene, Script, ScriptElement, ScriptElementType } from "../models/ScriptModel";
import { I18n, i18nPDF, isRTL } from "../i18n/i18n";
import { saveAs } from "./fileSaver";

import CourierRegular from "../fonts/Courier-Regular.otf";
import CourierBold from "../fonts/Courier-Bold.ttf";
import AlefRegular from "../fonts/Alef-Regular.ttf";
import AlefBold from "../fonts/Alef-Bold.ttf";

const ONE_INCH = 72;

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

const DIALOGUE_BOX_WIDTH = 300;

type PDFType = typeof PDFDocument;

function fixParenthesesInRTL(text: string): string {
    if (!isRTL(text)) return text;

    return text
        .replace(/\(([^)]+)\)/g, (_match, inner) => `)${inner}(`)
        .replace(/(\[)([^\]]+)(\])/g, (_match, open, inner, close) => `${close}${inner}${open}`)
        .replace(/(\{)([^}]+)(\})/g, (_match, open, inner, close) => `${close}${inner}${open}`);
}

function reverseNumbersForRTL(text: string): string {
    return text.replace(/\d+/g, (match) => match.split("").reverse().join(""));
}

function prepareTextForPDF(text: string): string {
    return isRTL(text) ? reverseNumbersForRTL(fixParenthesesInRTL(text)) : text;
}

function getTextFeatures(text: string): PDFKit.Mixins.OpenTypeFeatures[] {
    return isRTL(text) ? ["rtla"] : [];
}

function isNearPageEnd(doc: PDFType, y: number, extra = 0): boolean {
    return doc.page.height - y < ONE_INCH + extra;
}

function addPageIfNeeded(doc: PDFType, y: number, extra = 0): number {
    if (isNearPageEnd(doc, y, extra)) {
        doc.addPage(PAGE_OPTIONS);
        return ONE_INCH;
    }
    return y;
}

function renderSubtitleBlock(doc: PDFType, heading: string, lines: string[]): void {
    doc.font("Regular")
        .fontSize(FONT_SIZES.SUBTITLE)
        .fillColor([0, 0, 0])
        .text(heading, { align: "center", features: getTextFeatures(heading) });

    for (const line of lines) {
        doc.moveDown(0.1);
        doc.fontSize(FONT_SIZES.SUBTITLE * 0.8)
            .fillColor([100, 100, 100])
            .text(line, { align: "center", features: getTextFeatures(line) });
    }
}

function renderTitlePage(doc: PDFType, script: Script): void {
    doc.addPage(PAGE_OPTIONS);
    doc.y = doc.page.height / 2 - FONT_SIZES.TITLE * 2;

    const title = script.metadata.title || "Untitled script";
    doc.font("Bold")
        .fontSize(FONT_SIZES.TITLE)
        .text(title, { align: "center", features: getTextFeatures(title) });

    if (script.metadata.subtitle) {
        doc.font("Regular")
            .fontSize(FONT_SIZES.TITLE * 0.6)
            .text(script.metadata.subtitle, {
                align: "center",
                features: getTextFeatures(script.metadata.subtitle),
            });
    }

    doc.moveDown(2);
    const writersList =
        script.metadata.writers === "inherit"
            ? ["inherit"]
            : script.metadata.writers.length > 0
            ? script.metadata.writers
            : ["Unknown Writer"];
    renderSubtitleBlock(doc, i18nPDF.t("pdf.writtenBy"), writersList);

    if (script.metadata.prodCompany && script.metadata.prodCompany !== "inherit") {
        doc.moveDown(1);
        renderSubtitleBlock(doc, i18nPDF.t("pdf.producedBy"), [script.metadata.prodCompany]);
    }

    if (script.metadata.date && script.metadata.date !== "inherit") {
        doc.moveDown(1);
        const parsedDate = new Date(script.metadata.date);
        const formattedDate = isNaN(parsedDate.getTime())
            ? script.metadata.date
            : parsedDate.toLocaleDateString(i18nPDF.getCurrentLanguage());
        renderSubtitleBlock(doc, i18nPDF.t("pdf.date"), [formattedDate]);
    }
}

function renderAction(content: string, doc: PDFType): void {
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

function renderDialogue(content: string, doc: PDFType): void {
    const isCentered = content.startsWith('"');
    const textContent = isCentered ? content.slice(1).trim() : content;
    const align = isCentered ? "center" : isRTL(textContent) ? "right" : "left";
    const formattedContent = prepareTextForPDF(textContent);

    doc.x = (doc.page.width - DIALOGUE_BOX_WIDTH) / 2;

    doc.font("Regular")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(formattedContent, {
            align,
            features: getTextFeatures(formattedContent),
            width: DIALOGUE_BOX_WIDTH,
        });

    doc.x = ONE_INCH;
}

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

function renderSubheader(content: string, doc: PDFType): void {
    const text = prepareTextForPDF(content).toUpperCase();
    const align = isRTL(content) ? "right" : "left";

    doc.font("Bold")
        .fontSize(FONT_SIZES.DEFAULT)
        .fillColor([0, 0, 0])
        .text(text, {
            align,
            features: getTextFeatures(text),
            width: doc.page.width - ONE_INCH * 2,
        });
}

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

function renderSceneHeading(doc: PDFType, heading: string, sceneNumber: number, y: number): void {
    const upperText = prepareTextForPDF(heading.toUpperCase());
    const sceneNumStr = String(sceneNumber);

    doc.font("Bold").fontSize(FONT_SIZES.DEFAULT).fillColor([0, 0, 0]);

    doc.text(sceneNumStr, (ONE_INCH - doc.widthOfString(sceneNumStr)) / 2, y, {
        align: "left",
        features: getTextFeatures(upperText),
    });

    doc.text(sceneNumStr, doc.page.width - doc.widthOfString(sceneNumStr) - ONE_INCH / 2, y, {
        align: "right",
        features: getTextFeatures(upperText),
    });

    const align = isRTL(heading) ? "right" : "left";
    doc.text(upperText, ONE_INCH, y, {
        align,
        features: getTextFeatures(upperText),
    });
}

function renderScene(scene: Scene, doc: PDFType, y: number): number {
    y = addPageIfNeeded(doc, y, FONT_SIZES.TITLE);

    if (scene.id > 0 && scene.heading) {
        renderSceneHeading(doc, scene.heading, scene.id, y);
        doc.outline.addItem(scene.heading, { expanded: true });
    }

    let startIndex = 0;
    if (scene.elements.length > 0 && scene.elements[0].type === ScriptElementType.Subheader) {
        renderSubheader(scene.elements[0].content, doc);
        startIndex = 1;
    }

    for (let i = startIndex; i < scene.elements.length; i++) {
        if (i === startIndex || scene.elements[i - 1].type !== scene.elements[i].type) {
            doc.moveDown(0.5);
        }

        renderElement(scene.elements[i], doc);

        if (isNearPageEnd(doc, doc.y)) {
            doc.addPage(PAGE_OPTIONS);
        }
    }

    return doc.y;
}

function initializeFonts(doc: PDFType, language: string): void {
    const useHebrewFonts = language === "he";
    const regularBuffer = useHebrewFonts ? AlefRegular : CourierRegular;
    const boldBuffer = useHebrewFonts ? AlefBold : CourierBold;

    doc.registerFont("Regular", Buffer.from(regularBuffer.split(",")[1], "base64"));
    doc.registerFont("Bold", Buffer.from(boldBuffer.split(",")[1], "base64"));
    doc.font("Regular").fontSize(FONT_SIZES.DEFAULT);
}

export async function createPDF(script: Script): Promise<void> {
    const sampleText = [
        script.metadata.title,
        typeof script.metadata.writers === "string" ? "" : script.metadata.writers.join(", "),
        ...script.scenes.map((s) => s.heading),
    ].join(" ");

    const detectedLanguage = I18n.detectLanguage(sampleText);
    i18nPDF.setLanguage(detectedLanguage);

    const doc = new PDFDocument({
        ...BASE_PAGE_OPTIONS,
        lang: i18nPDF.getCurrentLanguage(),
        autoFirstPage: false,
    });
    const outputStream = doc.pipe(blobStream());

    initializeFonts(doc, i18nPDF.getCurrentLanguage());
    renderTitlePage(doc, script);

    doc.addPage(PAGE_OPTIONS);
    let y = ONE_INCH;
    for (const scene of script.scenes) {
        y = renderScene(scene, doc, y);
        y += 0.5 * FONT_SIZES.DEFAULT;
    }

    return new Promise<void>((resolve, reject) => {
        outputStream.on("finish", async () => {
            try {
                const blob = outputStream.toBlob("application/pdf");
                const fileName = `${script.metadata.title || "Untitled script"}.pdf`;
                await saveAs(blob, fileName);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
        outputStream.on("error", reject);
        doc.end();
    });
}
