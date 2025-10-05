import { ScriptMetadata } from "../models/ScriptModel";
import { FrontMatterCache } from "obsidian";

/*
*
*   SCRIPT PARSING
*
*/


/*
*
*   SCRIPT METADATA PARSING
*
*/
// TODO: edit this function to work
export function parseMetadata(frontmatter: FrontMatterCache, content: string): { metadata: ScriptMetadata; contentWithoutFrontmatter: string } {
    if (frontmatter) {
        const frontmatterContent = frontmatter;
        const scriptContent = frontmatter[2] || '';

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

//! Helper function to serialize metadata to frontmatter
/*export function serializeFrontmatter(metadata: ScriptMetadata): string {
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
}*/