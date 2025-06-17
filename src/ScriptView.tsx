import { TextFileView, WorkspaceLeaf, TFile } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ScriptEditor } from "./components/ScriptEditor";
import React from "react";

export const SCRIPT_VIEW_TYPE = "script-view";
export const DEFAULT_DATA = "";

export class ScriptView extends TextFileView
{
    root: Root | null = null;
    data: string = DEFAULT_DATA;

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
        return "Script Editor";
    }

    getViewData(): string 
    {
        return this.data;
    }

    setViewData(data: string, clear: boolean = false): void 
    {
        this.data = data;

        if (clear)
            this.clear();
        else
            this.save(false);
    }

    getIcon(): string 
    {
        return 'scroll-text';
    }

    clear(): void 
    {
        this.setViewData(DEFAULT_DATA);
        this.root?.render(null);
    }

    async onLoadFile(file: TFile): Promise<void> 
    {
        await super.onLoadFile(file);
        const content = await this.app.vault.read(file);

        const container = this.containerEl.children[1];
        container.empty();

        this.root = createRoot(container);
        this.root.render(
            <ScriptEditor
                initialContent = {content}
                onChange = {this.save}
            />
        );
    }

    async onUnloadFile(file: TFile): Promise<void> 
    {
        await super.onUnloadFile(file);
        this.root?.unmount();
    }

    async save(clear: boolean = false): Promise<void> 
    {
        if (this.file)
        {
            if (clear) 
                this.clear();
            else
                await this.app.vault.modify(this.file, this.data);
        }
    }
}