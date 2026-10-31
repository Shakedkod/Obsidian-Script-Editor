import { Menu, Notice, TextFileView, TFile, WorkspaceLeaf } from "obsidian";
import React from "react";
import ReactDOM from "react-dom";

import ScriptEditor, { EditorMode } from "./ui/ScriptEditor";
import { i18n } from "./i18n/i18n";
import { parseFull, parseMetadata } from "./services/scriptParsing";
import { createPDF } from "./services/pdfGenerations";

export const SCRIPT_EDITOR_VIEW_TYPE = "script-editor-view";

export class ScriptEditorView extends TextFileView {
    data = "";
    private currentMode: EditorMode = "preview";

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType(): string {
        return SCRIPT_EDITOR_VIEW_TYPE;
    }

    getDisplayText(): string {
        return this.file?.basename ?? "Untitled script";
    }

    getIcon(): string {
        return "scroll-text";
    }

    getMode(): EditorMode {
        return this.currentMode;
    }

    setMode(mode: EditorMode): void {
        this.currentMode = mode;
        this.renderView();
    }

    getViewData(): string {
        return this.data;
    }

    setViewData(data: string, clear: boolean): void {
        if (clear) {
            this.clear();
        }
        this.data = data;
        this.renderView();
    }

    clear(): void {
        this.data = "";
    }

    async onClose(): Promise<void> {
        ReactDOM.unmountComponentAtNode(this.contentEl);
        await super.onClose();
    }

    public async openCharacterNote(name: string, folder = ""): Promise<void> {
        const normalizedFolder = folder.replace(/\/+$/, "");
        const path = normalizedFolder ? `${normalizedFolder}/${name}.md` : `${name}.md`;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (file instanceof TFile) {
            await this.app.workspace.getLeaf(true).openFile(file);
        } else {
            new Notice(i18n.t("notices.characterNotFound"));
        }
    }

    onPaneMenu(menu: Menu, source: "more-options" | "tab-header" | string): void {
        if (this.currentMode !== "preview") {
            menu.addItem((item) => {
                item.setTitle(i18n.t("menu.switchToPreview"))
                    .setIcon(this.currentMode === "metadata" ? "eye" : "switch")
                    .setSection("pane")
                    .onClick(() => this.setMode("preview"));
            });
        }

        if (this.currentMode !== "source") {
            menu.addItem((item) => {
                item.setTitle(i18n.t("menu.switchToSource"))
                    .setIcon(this.currentMode === "metadata" ? "code" : "switch")
                    .setSection("pane")
                    .onClick(() => this.setMode("source"));
            });
        }

        if (this.currentMode !== "metadata") {
            menu.addItem((item) => {
                item.setTitle(i18n.t("menu.editMetadata"))
                    .setIcon("info")
                    .setSection("pane")
                    .onClick(() => this.setMode("metadata"));
            });
        }

        menu.addItem((item) => {
            item.setTitle(i18n.t("menu.exportToPdf"))
                .setIcon("arrow-right-from-line")
                .setSection("action")
                .onClick(() => this.exportToPDFWithNotice());
        });

        super.onPaneMenu(menu, source);
    }

    async exportToPDF(): Promise<void> {
        if (!this.file) {
            return;
        }
        const { metadata, contentWithoutFrontmatter } = parseMetadata(this.data);
        const parsedScript = parseFull(metadata, contentWithoutFrontmatter);
        await createPDF(parsedScript);
    }

    async exportToPDFWithNotice(): Promise<void> {
        try {
            await this.exportToPDF();
            new Notice(i18n.t("notices.exportSuccess"));
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            new Notice(`${i18n.t("notices.exportFailed")}: ${message}`);
        }
    }

    private handleEditorChange = (newData: string): void => {
        if (this.data === newData) return;
        this.data = newData;
        this.requestSave();
    };

    private renderView(): void {
        ReactDOM.render(
            React.createElement(ScriptEditor, {
                data: this.data,
                mode: this.currentMode,
                onChange: this.handleEditorChange,
            }),
            this.contentEl
        );
    }
}
