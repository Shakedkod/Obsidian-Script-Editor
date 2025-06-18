import { TextFileView, WorkspaceLeaf, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ScriptEditor } from "./components/ScriptEditor";
import React from "react";
import { ScriptMetadata } from "./scriptParser";

export const SCRIPT_VIEW_TYPE = "script-view";
export const DEFAULT_DATA = "";

export class ScriptView extends TextFileView
{
    root: Root | null = null;
    data: string = DEFAULT_DATA;
    private hasUnsavedChanges: boolean = false;

    constructor(leaf: WorkspaceLeaf)
    {
        super(leaf);
    }

    getViewType(): string
    {
        return SCRIPT_VIEW_TYPE;
    }

    getDisplayText(): string
    {
        return this.file?.basename ?? "Untitled Script";
    }

    getViewData(): string 
    {
        return this.data;
    }

    setViewData(data: string, clear: boolean = false): void 
    {
        const dataChanged = this.data !== data;
        this.data = data;
        
        if (dataChanged) {
            this.hasUnsavedChanges = true;
        }

        if (clear) {
            this.clear();
            this.hasUnsavedChanges = false;
        }
    }

    getIcon(): string 
    {
        return 'scroll-text';
    }

    clear(): void 
    {
        this.setViewData(DEFAULT_DATA);
        this.root?.render(null);
        this.hasUnsavedChanges = false;
    }

    async onLoadFile(file: TFile): Promise<void> 
    {
        await super.onLoadFile(file);
        const content = await this.app.vault.read(file);
        this.data = content;
        this.hasUnsavedChanges = false;

        const container = this.containerEl.children[1];
        container.empty();

        this.root = createRoot(container);
        this.root.render(
            <ScriptEditor
                file={file}
                app={this.app}
                setData={(data: string) => this.setViewData(data)}
                onSave={() => this.hasUnsavedChanges = false}
            />
        );
    }

    async onUnloadFile(file: TFile): Promise<void> 
    {
        // Save before unloading if there are unsaved changes
        if (this.hasUnsavedChanges && this.file) {
            try {
                await this.app.vault.modify(this.file, this.data);
                console.log("💾 Auto-saved on close:", this.file.basename);
            } catch (error) {
                console.error("Failed to auto-save on close:", error);
            }
        }
        
        await super.onUnloadFile(file);
        this.root?.unmount();
        this.hasUnsavedChanges = false;
    }

    // Override the close method to ensure saving
    async onClose(): Promise<void> {
        if (this.hasUnsavedChanges && this.file) {
            try {
                await this.app.vault.modify(this.file, this.data);
                console.log("💾 Auto-saved on view close:", this.file.basename);
            } catch (error) {
                console.error("Failed to auto-save on view close:", error);
            }
        }
        this.hasUnsavedChanges = false;
    }

    async save(clear: boolean = false): Promise<void> 
    {
        if (this.file)
        {
            if (clear) {
                this.clear();
            } else {
                await this.app.vault.modify(this.file, this.data);
                this.hasUnsavedChanges = false;
            }
        }
    }

    async getScriptMetadata(file: TFile): Promise<ScriptMetadata | null>
    {
        const content = await this.app.vault.read(file);
        const metadataMatch = content.match(/---\n([\s\S]*?)\n---/);

        if (metadataMatch) 
        {
            const metadataLines = metadataMatch[1].split('\n').filter(line => line.trim() !== '');
            const metadata: ScriptMetadata = {
                title: "",
                author: "",
                prod_company: "",
                date: ""
            }
            for (const line of metadataLines) 
            {
                const [key, value] = line.split(':').map(part => part.trim());
                if (key && value) 
                {
                    switch (key.toLowerCase()) 
                    {
                        case 'title':
                            metadata.title = value;
                            break;
                        case 'author':
                            metadata.author = value;
                            break;
                        case 'prod_company':
                            metadata.prod_company = value;
                            break;
                        case 'date':
                            metadata.date = value;
                            break;
                    }
                }
            }
            return metadata;
        }
        else 
        {
            console.warn("No metadata found in file:", file.path);
            return null;
        }
    }
}