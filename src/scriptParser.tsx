import React from "react";
import { Action, Character, Dialogue, SceneHeading, Subheader, Transition } from "./components/ScriptParts";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import fontkit from '@pdf-lib/fontkit';

export type ScriptMetadata = {
    title: string;
    author: string;
    prod_company: string;
    date: string;
};

export enum ScriptElementType {
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Transition,
    Subheader
}

export type Scene = {
    id: number;
    heading: string;
    elements: ({ type: ScriptElementType; content: string })[];
};

export type Script = ScriptMetadata & {
    scenes: Scene[];
};

export function parseLine(line: string): { type: ScriptElementType; content: string } | Scene {
    if (line.startsWith("##"))
        return { type: ScriptElementType.Subheader, content: line.slice(2).trim() };
    if (line.startsWith("#"))
        return { id: 0, heading: line.slice(1).trim(), elements: [] };
    if (line.startsWith("@"))
        return { type: ScriptElementType.Character, content: line.slice(1).trim() };
    if (line.startsWith("\""))
        return { type: ScriptElementType.Dialogue, content: line.slice(1).trim() };
    if (line.startsWith("-"))
        return { type: ScriptElementType.Transition, content: line.slice(1).trim() };
    return { type: ScriptElementType.Action, content: line.trim() };
}

function isScene(obj: any): obj is Scene {
    return obj && typeof obj === "object" && "id" in obj && "heading" in obj && "elements" in obj;
}

export default function parseFull(metadata: ScriptMetadata, content: string): Script {
    var result: Script = {
        title: metadata.title,
        author: metadata.author,
        prod_company: metadata.prod_company,
        date: metadata.date,
        scenes: []
    };

    var sceneId = 1;
    var currentScene: Scene | null = null;
    var lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    for (var line of lines) {
        var current = parseLine(line);
        if (isScene(current)) {
            if (currentScene) {
                currentScene.id = sceneId;
                result.scenes.push(currentScene);
                sceneId++;
            }
            currentScene = current;
        }
        else if (currentScene) {
            if (!currentScene.elements) {
                currentScene.elements = [];
            }
            currentScene.elements.push(current);
        }
        else {
            currentScene = { id: 0, heading: "", elements: [] };
            currentScene.elements.push(current);
        }
    }

    return result;
}

export function scriptToReact(script: Script) {
    return (
        <>
            {script.scenes.map((scene, index) => {
                const totalDigits = script.scenes.length.toString().length;

                return (
                    <div key={index}>
                        <SceneHeading>{`${scene.id.toString().padStart(totalDigits, "0")}\t${scene.heading}`}</SceneHeading>
                        {scene.elements.map((element, elemIndex) => {
                            switch (element.type) {
                                case ScriptElementType.Character:
                                    return <Character>{element.content}</Character>;
                                case ScriptElementType.Dialogue:
                                    return <Dialogue>{element.content}</Dialogue>;
                                case ScriptElementType.Transition:
                                    return <Transition>{element.content}</Transition>;
                                case ScriptElementType.Subheader:
                                    return <Subheader>{element.content}</Subheader>;
                                default:
                                    return <Action>{element.content}</Action>;
                            }
                        })}
                    </div>
                );
            })}
        </>
    )
}

export function scriptStringToReact(script: string, metadata: ScriptMetadata) {
    const parsedScript = parseFull(metadata, script);
    return scriptToReact(parsedScript);
}

export function scriptLineToReact(line: string, numberOfScenes: number = 1, setNumberOfScenes: (count: number) => void) {
    const parsedLine = parseLine(line);
    if (isScene(parsedLine)) {
        var output = <SceneHeading>{`${numberOfScenes + 1}\t${parsedLine.heading}`}</SceneHeading>;
        setNumberOfScenes(numberOfScenes + 1);
        return output;
    }
    else {
        switch (parsedLine.type) {
            case ScriptElementType.Character:
                return <Character>{parsedLine.content}</Character>;
            case ScriptElementType.Dialogue:
                return <Dialogue>{parsedLine.content}</Dialogue>;
            case ScriptElementType.Transition:
                return <Transition>{parsedLine.content}</Transition>;
            case ScriptElementType.Subheader:
                return <Subheader>{parsedLine.content}</Subheader>;
            default:
                return <Action>{parsedLine.content}</Action>;
        }
    }
}

function isHebrew(text: string): boolean {
    return /^[\u0590-\u05FF]/.test(text.trim());
}

export async function loadFont(): Promise<Uint8Array> {
    const res = await fetch("../assets/Alef-Regular.ttf"); // adjust path if needed
    return new Uint8Array(await res.arrayBuffer());
}

function drawWrappedText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, maxWidth: number, fontSize: number, rtl: boolean = false) {
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (let word of words) {
        const test = current + (current ? ' ' : '') + word;
        const width = font.widthOfTextAtSize(test, fontSize);
        if (width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);

    for (const line of lines) {
        page.drawText(line, {
            x: rtl ? x + maxWidth - font.widthOfTextAtSize(line, fontSize) : x,
            y,
            font,
            size: fontSize,
            color: rgb(0, 0, 0),
        });
        y -= fontSize + 2;
    }

    return y;
}

export async function exportToPdf(script: Script, AlefRegular: Uint8Array, AlefBold: Uint8Array) {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const regular = await pdf.embedFont(AlefRegular);
    const bold = await pdf.embedFont(AlefBold);

    const pageWidth = 612; // A4/US letter width
    const pageHeight = 792;
    const margin = 50;
    const lineHeight = 16;

    // 📄 Title Page
    const titlePage = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 100;

    titlePage.drawText(script.title, {
        x: margin,
        y,
        size: 28,
        font: bold,
        color: rgb(0, 0, 0),
    });
    y -= 40;

    const metaEntries = [
        ['Author', script.author],
        ['Production Company', script.prod_company],
        ['Date', script.date]
    ];

    metaEntries.forEach(([label, value]) => {
        titlePage.drawText(`${label}: ${value}`, {
            x: margin,
            y,
            size: 16,
            font: regular,
            color: rgb(0.2, 0.2, 0.2),
        });
        y -= 24;
    });

    // 🎬 Script Pages
    let page = pdf.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;

    const newPage = () => {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
    };

    for (const scene of script.scenes) {
        const lines = scene.elements; // assuming your parsed scene has a `content: ScriptLine[]` field

        for (const line of lines) {
            if (y < margin + lineHeight * 2) newPage();

            let text = line.content.trim();
            let font = regular;
            let size = 12;
            let indent = 0;
            let rtl = isHebrew(text);

            switch (line.type) {
                case ScriptElementType.SceneHeading:
                    font = bold;
                    size = 14;
                    text = text.toUpperCase();
                    break;
                case ScriptElementType.Character:
                    font = bold;
                    size = 12;
                    indent = 200;
                    break;
                case ScriptElementType.Dialogue:
                    size = 12;
                    indent = 100;
                    break;
                case ScriptElementType.Transition:
                    size = 12;
                    indent = 300;
                    break;
                case ScriptElementType.Subheader:
                    font = regular;
                    size = 11;
                    indent = 20;
                    break;
                case ScriptElementType.Action:
                default:
                    size = 12;
                    indent = 0;
            }

            y = drawWrappedText(page, font, text, margin + indent, y, pageWidth - margin * 2 - indent, size, rtl);
            y -= 6;
        }

        y -= 20; // spacing between scenes
    }

    const pdfBytes = await pdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    saveAs(blob, `${script.title}.pdf`);
}
