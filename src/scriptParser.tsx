import React from "react";
import { Action, Character, Dialogue, SceneHeading, Subheader, Transition } from "./components/ScriptParts";

export type ScriptMetadata = {
    title: string;
    subtitle?: string; // Optional subtitle
    writers: string;
    prod_company: string;
    date: string;
    characterFolder?: string; // Optional folder for character notes
};

export enum ScriptElementType {
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Transition,
    Subheader
}

export type ScriptElement = {
    type: ScriptElementType;
    content: string;
};

export type Scene = {
    id: number;
    heading: string;
    elements: ScriptElement[];
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

export function isScene(obj: any): obj is Scene {
    return obj && typeof obj === "object" && "id" in obj && "heading" in obj && "elements" in obj;
}

export default function parseFull(metadata: ScriptMetadata, content: string): Script {
    let result: Script = {
        title: metadata.title,
        subtitle: metadata.subtitle, // Optional subtitle
        writers: metadata.writers,
        prod_company: metadata.prod_company,
        date: metadata.date,
        scenes: []
    };

    let sceneId = 1;
    let currentScene: Scene | null = null;
    let lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    for (let line of lines) {
        let current = parseLine(line);
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

    if (currentScene) {
        currentScene.id = sceneId;
        result.scenes.push(currentScene);
    }
    return result;
}

export function scriptLineToReact(line: string, numberOfScenes: number = 1, setNumberOfScenes: (count: number) => void, openCharacterNote: (name: string) => void) {
    const parsedLine = parseLine(line);
    if (isScene(parsedLine)) {
        let output = <SceneHeading>{`${numberOfScenes + 1}\t${parsedLine.heading}`}</SceneHeading>;
        setNumberOfScenes(numberOfScenes + 1);
        return output;
    }
    else {
        switch (parsedLine.type) {
            case ScriptElementType.Character:
                return <Character openCharacterNote={openCharacterNote}>{parsedLine.content}</Character>;
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

export function parseMetadata(content: string): { metadata: ScriptMetadata; contentWithoutFrontmatter: string } {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    
    if (frontmatterMatch) {
        const frontmatterContent = frontmatterMatch[1];
        const scriptContent = frontmatterMatch[2] || '';
        
        const metadata: ScriptMetadata = {
            title: "",
            subtitle: "", // Optional subtitle
            writers: "",
            prod_company: "",
            date: "",
            characterFolder: "" // Optional folder for character notes
        };
        
        const lines = frontmatterContent.split(/\r?\n/);
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Remove surrounding quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                switch (key.toLowerCase()) {
                    case 'title':
                        metadata.title = value;
                        break;
                    case 'subtitle':
                        metadata.subtitle = value; // Optional subtitle
                        break;
                    case 'author':
                        metadata.writers = value;
                        break;
                    case 'prod_company':
                        metadata.prod_company = value;
                        break;
                    case 'date':
                        metadata.date = value;
                        break;
                    case 'characterfolder':
                        metadata.characterFolder = value; // Optional folder for character notes
                        break;
                }
            }
        }
        
        return { metadata, contentWithoutFrontmatter: scriptContent };
    } else {
        // No frontmatter found, return empty metadata and full content
        return {
            metadata: {
                title: "",
                writers: "",
                prod_company: "",
                date: "",
                characterFolder: "" // Optional folder for character notes
            },
            contentWithoutFrontmatter: content
        };
    }
}

// Helper function to serialize metadata to frontmatter
export function serializeFrontmatter(metadata: ScriptMetadata): string {
    const lines = [];
    
    // Helper function to properly quote values that need it
    const formatValue = (value: string): string => {
        if (!value) return '';
        // Quote if contains special characters, starts/ends with spaces, or contains colons
        if (value.includes(':') || value.includes('#') || value.includes('[') || value.includes(']') || 
            value.includes('{') || value.includes('}') || value.includes('|') || value.includes('>') ||
            value.startsWith(' ') || value.endsWith(' ') || value.includes('\n')) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
    };
    
    if (metadata.title) lines.push(`title: ${formatValue(metadata.title)}`);
    if (metadata.subtitle) lines.push(`subtitle: ${formatValue(metadata.subtitle)}`); // Optional subtitle
    if (metadata.writers) lines.push(`author: ${formatValue(metadata.writers)}`);
    if (metadata.prod_company) lines.push(`prod_company: ${formatValue(metadata.prod_company)}`);
    if (metadata.date) lines.push(`date: ${formatValue(metadata.date)}`);
    if (metadata.characterFolder) lines.push(`characterFolder: ${formatValue(metadata.characterFolder)}`); // Optional folder for character notes
    
    if (lines.length === 0) {
        return '';
    }
    
    return `---\n${lines.join('\n')}\n---\n`;
}