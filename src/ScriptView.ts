import { FileSystemAdapter, Menu, Notice, TextFileView, TFile } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import ScriptEditor from "./ui/ScriptEditor";
import { i18n } from "./i18n/i18n";
import { parseFull, parseMetadata } from "./services/scriptParsing";
import { createPDF } from "./services/pdfGenerations";

export const SCRIPT_EDITOR_VIEW_TYPE = "script-editor-view";
export const DEFAULT_DATA = "";

export class ScriptEditorView extends TextFileView
{
    data: string = DEFAULT_DATA;
    private root: React.ReactElement;
    private hasUnsavedChanges = false;
    private currentMode: "preview" | "source" | "metadata" = "preview";
    public setMode: (mode: "preview" | "source" | "metadata") => void;

    public async openCharacterNote(name: string): Promise<void>
    {
        const folder = ""; //this.plugin.settings.characterFolder;
        const path = `${folder}/${name}.md`;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile)
            await this.app.workspace.getLeaf(true).openFile(file);
        else
            new Notice(i18n.t('notices.characterNotFound'));
    }

    onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void 
    {
        if (this.currentMode !== "preview")
            menu.addItem((item) => {
                item.setTitle(i18n.t('menu.switchToPreview'));
                item.setIcon(this.currentMode === "metadata" ? "eye" : "switch");
                item.setSection("pane");
                item.onClick(() => {
                    this.setMode("preview");
                });
            });

        if (this.currentMode !== "source")
            menu.addItem((item) => {
                item.setTitle(i18n.t('menu.switchToSource'));
                item.setIcon(this.currentMode === "metadata" ? "code" : "switch");
                item.setSection("pane");
                item.onClick(() => {
                    this.setMode("source");
                });
            });

        if (this.currentMode !== "metadata")
            menu.addItem((item) => {
                item.setTitle(i18n.t('menu.editMetadata'));
                item.setIcon("info");
                item.setSection("pane");
                item.onClick(() => {
                    this.setMode("metadata");
                });
            });

        //menu.addItem((item) => {
        //    item.setTitle(i18n.t('menu.exportToPdf'));
        //    item.setIcon("arrow-right-from-line");
        //    item.setSection("action");
        //    item.onClick(async () => {
        //        try {
        //            await this.exportToPDF();
        //            new Notice("Script exported to PDF successfully.");
        //        } catch (error) {
        //            new Notice("Failed to export script: " + error.message);
        //        }
        //    });
        //});

        super.onPaneMenu(menu, source);
    }

    async onLoadFile(file: TFile): Promise<void>
    {
        await super.onLoadFile(file);

        this.data = await this.app.vault.read(file);
        this.hasUnsavedChanges = false;

        this.root = React.createElement(ScriptEditor({
            app: this.app,
            file: this.file,
            setData: (data: string) => this.setViewData(data, false),
            setModeCallback: (cb) => {
                this.setMode = cb;

                this.setMode = (mode: "preview" | "source" | "metadata") => {
                    this.currentMode = mode;
                    cb(mode);
                };
            },
            characterFolder: "", //this.plugin.settings.characterFolder,
            openCharacterNote: this.openCharacterNote.bind(this)
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

    async exportToPDF(): Promise<void>
    {
        if (!this.file) {
            console.error("No file to export.");
            return;
        }
        const scriptMetadata = parseMetadata(this.data).metadata;
        if (!scriptMetadata) {
            console.warn("No metadata found for script:", this.file.path);
            return;
        }

        if (!(this.app.vault.adapter instanceof FileSystemAdapter))
        {
            console.error("FileSystemAdapter is required for PDF export.");
            return;
        }

        const scriptContent = (await this.app.vault.read(this.file)).split("---")[2];
        const parsedScript = parseFull(scriptMetadata, scriptContent);
        createPDF(parsedScript);
    }
}