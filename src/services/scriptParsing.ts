import { isScene, Scene, Script, ScriptElementType, ScriptMetadata } from "../models/ScriptModel";
import { App, TFile, TFolder } from "obsidian";

/*
*
*   SCRIPT PARSING
*
*/
export function parseLine(line: string): { type: ScriptElementType; content: string } | Scene
{
    if (line.startsWith("## "))
        return { type: ScriptElementType.Subheader, content: line.slice(2).trim() };
    if (line.startsWith("# "))
        return { id: 0, heading: line.slice(1).trim(), elements: [] };
    if (line.startsWith("@"))
        return { type: ScriptElementType.Character, content: line.slice(1).trim() };
    if (line.startsWith("\""))
        return { type: ScriptElementType.Dialogue, content: line.slice(1).trim() };
    if (line.startsWith("- "))
        return { type: ScriptElementType.Transition, content: line.slice(1).trim() };
    return { type: ScriptElementType.Action, content: line.trim() };
}

export function getCharacterList(app: App, metadata: ScriptMetadata, characterFolder: string): string[]
{
    const folder = app.vault.getAbstractFileByPath(metadata.characterFolder || characterFolder);
    if (!(folder instanceof TFolder)) return [];

    return folder.children
        .filter(file => file instanceof TFile && file.extension === 'md')
        .map(file => (file instanceof TFile) ? file.basename : "");
}

export function parseFull(metadata: ScriptMetadata, content: string): Script {
    const result: Script = {
        title: metadata.title,
        subtitle: metadata.subtitle,
        writers: metadata.writers,
        prod_company: metadata.prod_company,
        date: metadata.date,
        scenes: []
    };

    let sceneId = 1;
    let currentScene: Scene | null = null;
    const lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
        const current = parseLine(line);
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

/*
*
*   SCRIPT METADATA PARSING
*
*/

// This function it technically not by obsidian standards,
//      but I didn't manage to get the app.metadataCache.getFileCache(file) to be anything but null
export function parseMetadata(content: string): { metadata: ScriptMetadata; contentWithoutFrontmatter: string } {
    const parts = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

    if (parts)
    {
        const frontmatter = parts[1];
        const scriptContent = parts[2] || '';

        const metadata: ScriptMetadata = {
            title: "",
            subtitle: "", // Optional subtitle
            writers: "",
            prod_company: "",
            date: "",
            characterFolder: "" // Optional folder for character notes
        };

        const lines = frontmatter.split(/\r?\n/);
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
                    case 'writers':
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
    }
    else // No frontmatter found, return empty metadata and full content
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