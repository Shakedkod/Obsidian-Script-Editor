import { App, TFile, TFolder } from "obsidian";
import { StoryScope } from "../models/StoryScope";
import { parseMetadata } from "./scriptParsing";

const STORY_FILE_NAME = "_story.md";

export async function resolveStoryScope(app: App, file: TFile): Promise<StoryScope | null> 
{
    let folder: TFolder | null = file.parent;

    while (folder) 
    {
        const storyFilePath = `${folder.path}/${STORY_FILE_NAME}`;
        const storyFile = app.vault.getAbstractFileByPath(storyFilePath);

        if (storyFile instanceof TFile) 
        {
            const text = await app.vault.read(storyFile);
            const parsed = parseMetadata(text);
            return parsed.metadata as StoryScope;
        }

        folder = folder.parent;
    }

    return null;
}
