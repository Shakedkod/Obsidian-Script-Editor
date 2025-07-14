import { TextFileView, WorkspaceLeaf, TFile, FileSystemAdapter, Menu, Notice } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { ScriptEditor } from "./components/ScriptEditor";
import parseFull, { parseMetadata } from "./scriptParser";
import { createPDF } from "./pdf";
import ScriptEditorPlugin from "main";
import { i18n } from "./i18n/i18n";
import React from "react";

export const SCRIPT_VIEW_TYPE = "script-view";
export const DEFAULT_DATA = "";

export class ScriptView extends TextFileView {
    root: Root | null = null;
    data: string = DEFAULT_DATA;
    plugin: ScriptEditorPlugin;
    private hasUnsavedChanges: boolean = false;
    private currentMode: "preview" | "source" | "metadata" = "preview";
    public setMode: (mode: "preview" | "source" | "metadata") => void = () => {};
    private actualSetMode: (mode: "preview" | "source" | "metadata") => void = () => {};

    constructor(leaf: WorkspaceLeaf, plugin: ScriptEditorPlugin, manifest: any = null) {
        super(leaf);
        this.plugin = plugin;

        this.setMode = (mode: "preview" | "source" | "metadata") => {
            this.currentMode = mode;
            // Call the actual mode change function that will be set by ScriptEditor
            this.actualSetMode(mode);
        };
    }

    getViewType(): string {
        return SCRIPT_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename ?? "Untitled Script";
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string, clear: boolean = false): void {
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

    getIcon(): string {
        return 'scroll-text';
    }

    clear(): void {
        this.setViewData(DEFAULT_DATA);
        this.root?.render(null);
        this.hasUnsavedChanges = false;
    }

    public async openCharacterNote(name: string)
	{
		const folder = this.plugin.settings.characterFolder;
		const path = `${folder}/${name}.md`;
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			await this.app.workspace.getLeaf(true).openFile(file);
		} else {
			new Notice(i18n.t('notices.characterNotFound'));
		}
	};
    
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

        menu.addItem((item) => {
            item.setTitle(i18n.t('menu.exportToPdf'));
            item.setIcon("arrow-right-from-line");
            item.setSection("action");
            item.onClick(async () => {
                try {
                    await this.exportToPDF();
                    new Notice("Script exported to PDF successfully.");
                } catch (error) {
                    new Notice("Failed to export script: " + error.message);
                }
            });
        });

        super.onPaneMenu(menu, source);
    }

    async onLoadFile(file: TFile): Promise<void> {
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
                characterFolder={this.plugin.settings.characterFolder}
                setData={(data: string) => this.setViewData(data)}
                setModeCallback={(cb) => {
                    this.actualSetMode = cb;

                    this.actualSetMode = (mode) => {
                        this.currentMode = mode;
                        cb(mode);
                    }
                }}
                openCharacterNote={this.openCharacterNote.bind(this)}
            />
        );
    }

    async exportToPDF(): Promise<void> 
    {
        if (!this.file) {
            console.error("No file to export.");
            return;
        }
        const scriptMetadata = parseMetadata(await this.app.vault.read(this.file)).metadata;
        if (!scriptMetadata) {
            console.warn("No metadata found for script:", this.file.path);
            return;
        }

        if (!(this.app.vault.adapter instanceof FileSystemAdapter))
        {
            console.error("FileSystemAdapter is required for PDF export.");
            return;
        }

        console.log();
        const CourierRegular = this.app.vault.adapter.getFullPath(`/${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/Courier-Regular.otf`);
        const CourierBold = this.app.vault.adapter.getFullPath(`/${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/Courier-Bold.ttf`); 
        const AlefRegular = this.app.vault.adapter.getFullPath(`/${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/Alef-Regular.ttf`);
        const AlefBold = this.app.vault.adapter.getFullPath(`/${this.app.vault.configDir}/plugins/${this.plugin.manifest.id}/Alef-Bold.ttf`);

        const scriptContent = (await this.app.vault.read(this.file)).split("---")[2];
        const parsedScript = parseFull(scriptMetadata, scriptContent);
        createPDF(CourierRegular, AlefRegular, CourierBold, AlefBold, parsedScript);
    };

    async onUnloadFile(file: TFile): Promise<void> {
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

    async save(clear: boolean = false): Promise<void> {
        if (this.file) {
            if (clear) {
                this.clear();
            } else {
                await this.app.vault.modify(this.file, this.data);
                this.hasUnsavedChanges = false;
            }
        }
    }
}