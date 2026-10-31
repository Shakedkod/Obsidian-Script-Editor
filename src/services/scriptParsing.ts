import { App, parseYaml, stringifyYaml, TFile, TFolder } from "obsidian";
import { DEFAULT_METADATA, ScriptMetadata } from "../models/ScriptMetadata";
import { isScene, Scene, Script, ScriptElement, ScriptElementType } from "../models/ScriptModel";

export function parseLine(line: string): ScriptElement | Scene {
    if (line.startsWith("## ")) {
        return { type: ScriptElementType.Subheader, content: line.slice(3).trim() };
    }
    if (line.startsWith("# ")) {
        return { id: 0, heading: line.slice(2).trim(), elements: [] };
    }
    if (line.startsWith("@ ")) {
        return { type: ScriptElementType.Character, content: line.slice(2).trim() };
    }
    if (line.startsWith('"')) {
        return { type: ScriptElementType.Dialogue, content: line.slice(1).trim() };
    }
    if (line.startsWith("- ")) {
        return { type: ScriptElementType.Transition, content: line.slice(2).trim() };
    }
    return { type: ScriptElementType.Action, content: line.trim() };
}

export function getCharacterList(
    app: App,
    metadata: ScriptMetadata,
    characterFolder: string
): string[] {
    const folderPath =
        metadata.characterFolder && metadata.characterFolder !== "inherit"
            ? metadata.characterFolder
            : characterFolder;
    if (!folderPath) return [];

    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!(folder instanceof TFolder)) return [];

    return folder.children
        .filter((file): file is TFile => file instanceof TFile && file.extension === "md")
        .map((file) => file.basename);
}

export function parseFull(metadata: ScriptMetadata, content: string): Script {
    const result: Script = {
        metadata: { ...metadata },
        scenes: [],
    };

    let sceneId = 1;
    let currentScene: Scene | null = null;
    const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    for (const line of lines) {
        const parsed = parseLine(line);
        if (isScene(parsed)) {
            if (currentScene) {
                currentScene.id = sceneId++;
                result.scenes.push(currentScene);
            }
            currentScene = parsed;
        } else {
            if (!currentScene) {
                currentScene = { id: 0, heading: "", elements: [] };
            }
            currentScene.elements.push(parsed);
        }
    }

    if (currentScene) {
        currentScene.id = sceneId;
        result.scenes.push(currentScene);
    }

    return result;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseWritersField(raw: unknown): string[] | "inherit" {
    if (raw === "inherit" || raw === undefined || raw === null) {
        return "inherit";
    }
    if (Array.isArray(raw)) {
        return raw.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed || trimmed === "inherit") return "inherit";
        return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return "inherit";
}

export function parseMetadata(content: string): {
    metadata: ScriptMetadata;
    contentWithoutFrontmatter: string;
} {
    const match = content.match(FRONTMATTER_REGEX);
    if (!match) {
        return {
            metadata: { ...DEFAULT_METADATA },
            contentWithoutFrontmatter: content,
        };
    }

    const frontmatter = match[1];
    const contentWithoutFrontmatter = match[2] ?? "";
    const metadata: ScriptMetadata = { ...DEFAULT_METADATA };

    try {
        const parsed = parseYaml(frontmatter) as Record<string, unknown> | null;
        if (parsed && typeof parsed === "object") {
            if (typeof parsed.title === "string") metadata.title = parsed.title;
            if (typeof parsed.subtitle === "string") metadata.subtitle = parsed.subtitle;
            metadata.writers = parseWritersField(parsed.writers);

            const prodCompany = parsed.prodCompany ?? parsed.prod_company;
            if (typeof prodCompany === "string") metadata.prodCompany = prodCompany;

            if (typeof parsed.date === "string") metadata.date = parsed.date;

            const charFolder = parsed.characterFolder ?? parsed.character_folder;
            if (typeof charFolder === "string") metadata.characterFolder = charFolder;

            const locFolder = parsed.locationFolder ?? parsed.location_folder;
            if (typeof locFolder === "string") metadata.locationFolder = locFolder;

            return { metadata, contentWithoutFrontmatter };
        }
    } catch {
        // Fallback to manual line parsing if YAML is malformed
    }

    for (const line of frontmatter.split(/\r?\n/)) {
        const colonIndex = line.indexOf(":");
        if (colonIndex <= 0) continue;

        const key = line.slice(0, colonIndex).trim().toLowerCase();
        const value = line
            .slice(colonIndex + 1)
            .trim()
            .replace(/^["']|["']$/g, "");

        switch (key) {
            case "title":
                metadata.title = value;
                break;
            case "subtitle":
                metadata.subtitle = value;
                break;
            case "writers":
                metadata.writers = parseWritersField(value);
                break;
            case "prod_company":
            case "prodcompany":
                metadata.prodCompany = value;
                break;
            case "date":
                metadata.date = value;
                break;
            case "character_folder":
            case "characterfolder":
                metadata.characterFolder = value;
                break;
            case "location_folder":
            case "locationfolder":
                metadata.locationFolder = value;
                break;
        }
    }

    return { metadata, contentWithoutFrontmatter };
}

export function serializeScript(metadata: ScriptMetadata, scriptContent: string): string {
    const hasMetadata = Object.values(metadata).some((value) => value !== "");
    if (!hasMetadata) {
        return scriptContent;
    }
    return `---\n${stringifyYaml(metadata)}---\n${scriptContent}`;
}
