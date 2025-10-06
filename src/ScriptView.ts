import { TextFileView, TFile } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import ScriptEditor from "./ui/ScriptEditor";

export const SCRIPT_EDITOR_VIEW_TYPE = "script-editor-view";
export const DEFAULT_DATA = "";

export class ScriptEditorView extends TextFileView
{
    data: string = DEFAULT_DATA;
    private root: React.ReactElement;
    private hasUnsavedChanges = false;

    //constructor(leaf: WorkspaceLeaf)
    //{
    //    super(leaf);
    //}

    async onLoadFile(file: TFile): Promise<void>
    {
        await super.onLoadFile(file);

        this.data = await this.app.vault.read(file);
        this.hasUnsavedChanges = false;

        this.root = React.createElement(ScriptEditor({
            app: this.app,
            file: this.file,
            setData: (data: string) => this.setViewData(data, false)
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ReactDOM.render(this.root, (this as any).contentEl);
    }

    getViewData(): string
    {
        return this.data;
    }

    setViewData(data: string, clear: boolean): void
    {
        const dataChanged = this.data !== data;
        this.data = data;

        if (dataChanged) {
            this.hasUnsavedChanges = true;
        }

        if (clear)
        {
            this.clear();
            this.hasUnsavedChanges = false;
        }
    }

    async onUnloadFile(file: TFile): Promise<void>
    {
        // Save before unloading if there are unsaved changes
        if (this.hasUnsavedChanges && this.file)
        {
            try
            {
                await this.app.vault.modify(this.file, this.data);
            }
            catch (error)
            {
                console.error("Failed to auto-save on close:", error);
            }
        }

        await super.onUnloadFile(file);
        this.hasUnsavedChanges = false;
    }

    // Override the close method to ensure saving
    async onClose(): Promise<void>
    {
        if (this.hasUnsavedChanges && this.file)
            try
            {
                await this.app.vault.modify(this.file, this.data);
            }
            catch (error)
            {
                console.error("Failed to auto-save on view close:", error);
            }

        this.hasUnsavedChanges = false;
    }

    async save(clear = false): Promise<void>
    {
        if (this.file)
            if (clear)
                this.clear();
            else
            {
                await this.app.vault.modify(this.file, this.data);
                this.hasUnsavedChanges = false;
            }
    }

    clear(): void
    {
        this.setViewData(DEFAULT_DATA, false);
        //this.root?.render(null);
        this.hasUnsavedChanges = false;
    }

    getViewType(): string
    {
        return SCRIPT_EDITOR_VIEW_TYPE;
    }

    getDisplayText(): string
    {
        return this.file?.basename ?? "Untitled script";
    }

    getIcon(): string
    {
        return 'scroll-text';
    }
}