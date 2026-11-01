import { App, normalizePath, parseYaml, stringifyYaml, TFile, TFolder } from "obsidian";
import { DEFAULT_STORY_METADATA, StoryMetadata } from "../models/StoryMetadata";
import { ScriptMetadata } from "../models/ScriptMetadata";

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function parseWritersList(raw: unknown): string[] {
    if (!raw || raw === "inherit") return [];
    if (Array.isArray(raw)) {
        return raw.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof raw === "string") {
        return raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    return [];
}

export function parseStoryMetadata(content: string): StoryMetadata {
    const metadata: StoryMetadata = { ...DEFAULT_STORY_METADATA, writers: [] };
    const trimmed = content.trim();
    if (!trimmed) return metadata;

    const match = content.match(FRONTMATTER_REGEX);
    const yamlContent = match ? match[1] : content;

    try {
        const parsed = parseYaml(yamlContent) as Record<string, unknown> | null;
        if (parsed && typeof parsed === "object") {
            if (typeof parsed.title === "string") metadata.title = parsed.title;
            metadata.writers = parseWritersList(parsed.writers);

            const prodCompany = parsed.prodCompany ?? parsed.prod_company;
            if (typeof prodCompany === "string") metadata.prodCompany = prodCompany;

            if (typeof parsed.date === "string") metadata.date = parsed.date;

            const charFolder = parsed.characterFolder ?? parsed.character_folder;
            if (typeof charFolder === "string") metadata.characterFolder = charFolder;

            const locFolder = parsed.locationFolder ?? parsed.location_folder;
            if (typeof locFolder === "string") metadata.locationFolder = locFolder;

            return metadata;
        }
    } catch {
        // Fallback to manual line parsing if YAML is malformed
    }

    for (const line of yamlContent.split(/\r?\n/)) {
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
            case "writers":
                metadata.writers = parseWritersList(value);
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

    return metadata;
}

export function serializeStory(metadata: StoryMetadata): string {
    return `---\n${stringifyYaml(metadata)}---\n`;
}

/**
 * Walks up the folder hierarchy starting from `file.parent` to find the nearest `.story` file.
 * If a subfolder has its own `.story` file, scripts in that subfolder find it first before reaching parent folders.
 */
export function findControllingStoryFile(app: App, file: TFile): TFile | null {
    let currentFolder: TFolder | null = file.parent;

    while (currentFolder) {
        const storyFiles = currentFolder.children.filter(
            (child): child is TFile => child instanceof TFile && child.extension === "story"
        );

        if (storyFiles.length > 0) {
            storyFiles.sort((a, b) => a.name.localeCompare(b.name));
            return storyFiles[0];
        }

        currentFolder = currentFolder.parent;
    }

    return null;
}

/**
 * Resolves a folder path that may be relative to a base folder (e.g. `./Characters` or `Characters`)
 * or relative to the vault root (e.g. `MyStory/Characters`).
 */
export function resolveStoryFolderPath(
    app: App,
    rawFolderPath: string | undefined,
    baseFolder: TFolder | null
): string {
    if (!rawFolderPath || rawFolderPath === "inherit") return "";

    const trimmed = rawFolderPath.trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) return "";

    // Explicit relative path (./ or ../)
    if (trimmed.startsWith("./") || trimmed.startsWith("../")) {
        const basePath = baseFolder && baseFolder.path !== "/" ? baseFolder.path : "";
        const combined = basePath ? `${basePath}/${trimmed}` : trimmed;
        return normalizePath(combined);
    }

    // Check if it exists relative to the baseFolder first (when baseFolder is not root)
    if (baseFolder && baseFolder.path !== "/") {
        const relativeCandidate = normalizePath(`${baseFolder.path}/${trimmed}`);
        if (app.vault.getAbstractFileByPath(relativeCandidate) instanceof TFolder) {
            return relativeCandidate;
        }
    }

    // Otherwise check/return normalized vault-root path, or fallback to relative if vault-root doesn't exist
    const rootCandidate = normalizePath(trimmed);
    if (app.vault.getAbstractFileByPath(rootCandidate) instanceof TFolder) {
        return rootCandidate;
    }

    if (baseFolder && baseFolder.path !== "/") {
        return normalizePath(`${baseFolder.path}/${trimmed}`);
    }

    return rootCandidate;
}

export interface ResolvedScriptContext {
    storyFile: TFile | null;
    storyMetadata: StoryMetadata | null;
    effectiveMetadata: ScriptMetadata;
}

function isInherited(value: unknown): boolean {
    if (value === undefined || value === null || value === "inherit") return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
}

/**
 * Merges a script's own metadata with its controlling `.story` file's metadata.
 * Any field set to `"inherit"` (or left empty where applicable) inherits from the story file.
 */
export function resolveEffectiveMetadata(
    app: App,
    scriptFile: TFile | null,
    scriptMetadata: ScriptMetadata,
    storyMetadata: StoryMetadata | null,
    storyFile: TFile | null
): ScriptMetadata {
    const storyFolder = storyFile?.parent ?? scriptFile?.parent ?? null;
    const scriptFolder = scriptFile?.parent ?? null;

    if (!storyMetadata) {
        return {
            ...scriptMetadata,
            characterFolder:
                scriptMetadata.characterFolder && scriptMetadata.characterFolder !== "inherit"
                    ? resolveStoryFolderPath(app, scriptMetadata.characterFolder, scriptFolder)
                    : "",
            locationFolder:
                scriptMetadata.locationFolder && scriptMetadata.locationFolder !== "inherit"
                    ? resolveStoryFolderPath(app, scriptMetadata.locationFolder, scriptFolder)
                    : "",
        };
    }

    const writers =
        scriptMetadata.writers === "inherit"
            ? storyMetadata.writers
            : scriptMetadata.writers;

    const prodCompany = isInherited(scriptMetadata.prodCompany)
        ? storyMetadata.prodCompany
        : scriptMetadata.prodCompany;

    const date = isInherited(scriptMetadata.date)
        ? storyMetadata.date
        : scriptMetadata.date;

    const characterFolder = isInherited(scriptMetadata.characterFolder)
        ? resolveStoryFolderPath(app, storyMetadata.characterFolder, storyFolder)
        : resolveStoryFolderPath(app, scriptMetadata.characterFolder, scriptFolder);

    const locationFolder = isInherited(scriptMetadata.locationFolder)
        ? resolveStoryFolderPath(app, storyMetadata.locationFolder, storyFolder)
        : resolveStoryFolderPath(app, scriptMetadata.locationFolder, scriptFolder);

    const title = scriptMetadata.title || storyMetadata.title;
    const subtitle =
        scriptMetadata.subtitle ||
        (scriptMetadata.title && storyMetadata.title && scriptMetadata.title !== storyMetadata.title
            ? storyMetadata.title
            : scriptMetadata.subtitle);

    return {
        title,
        subtitle,
        writers,
        prodCompany,
        date,
        characterFolder,
        locationFolder,
    };
}

/**
 * Loads the controlling `.story` file (if any) for a given script file and resolves the effective metadata.
 */
export async function resolveScriptContext(
    app: App,
    scriptFile: TFile | null,
    scriptMetadata: ScriptMetadata
): Promise<ResolvedScriptContext> {
    if (!scriptFile) {
        return {
            storyFile: null,
            storyMetadata: null,
            effectiveMetadata: resolveEffectiveMetadata(app, null, scriptMetadata, null, null),
        };
    }

    const storyFile = findControllingStoryFile(app, scriptFile);
    if (!storyFile) {
        return {
            storyFile: null,
            storyMetadata: null,
            effectiveMetadata: resolveEffectiveMetadata(app, scriptFile, scriptMetadata, null, null),
        };
    }

    const rawStory = await app.vault.cachedRead(storyFile);
    const storyMetadata = parseStoryMetadata(rawStory);
    const effectiveMetadata = resolveEffectiveMetadata(
        app,
        scriptFile,
        scriptMetadata,
        storyMetadata,
        storyFile
    );

    return {
        storyFile,
        storyMetadata,
        effectiveMetadata,
    };
}
