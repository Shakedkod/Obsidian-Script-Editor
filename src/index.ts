import { getLanguage, Plugin, WorkspaceLeaf } from "obsidian";
import { ScriptEditorView, SCRIPT_EDITOR_VIEW_TYPE } from "./ScriptView";
import { i18n } from "./i18n/i18n";
import { parseMetadata } from "./services/scriptParsing";

const WORDS_PER_MINUTE = 130;

export default class ScriptEditorPlugin extends Plugin {
    private statusBarItemEl: HTMLElement | null = null;

    async onload(): Promise<void> {
        i18n.setLanguageFromString(getLanguage());

        this.registerView(
            SCRIPT_EDITOR_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new ScriptEditorView(leaf)
        );
        this.registerExtensions(["script"], SCRIPT_EDITOR_VIEW_TYPE);

        this.statusBarItemEl = this.addStatusBarItem();
        this.statusBarItemEl.hide();

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", () => {
                this.updateRuntimeEstimate();
            })
        );

        this.registerEvent(
            this.app.vault.on("modify", (file) => {
                if (file === this.app.workspace.getActiveFile()) {
                    this.updateRuntimeEstimate();
                }
            })
        );

        this.addCommand({
            id: "toggle-preview-mode",
            name: "Toggle preview mode",
            checkCallback: (checking: boolean) => {
                const view = this.app.workspace.getActiveViewOfType(ScriptEditorView);
                if (!view) return false;
                if (!checking) {
                    view.setMode(view.getMode() === "preview" ? "source" : "preview");
                }
                return true;
            },
        });

        this.addCommand({
            id: "edit-script-metadata",
            name: "Edit script metadata",
            checkCallback: (checking: boolean) => {
                const view = this.app.workspace.getActiveViewOfType(ScriptEditorView);
                if (!view) return false;
                if (!checking) {
                    view.setMode(view.getMode() === "metadata" ? "preview" : "metadata");
                }
                return true;
            },
        });

        this.addCommand({
            id: "export-script-to-pdf",
            name: "Export script to PDF",
            checkCallback: (checking: boolean) => {
                const view = this.app.workspace.getActiveViewOfType(ScriptEditorView);
                if (!view) return false;
                if (!checking) {
                    view.exportToPDFWithNotice();
                }
                return true;
            },
        });
    }

    private async updateRuntimeEstimate(): Promise<void> {
        if (!this.statusBarItemEl) return;

        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile || activeFile.extension !== "script") {
            this.statusBarItemEl.hide();
            return;
        }

        const rawContent = await this.app.vault.read(activeFile);
        const { contentWithoutFrontmatter } = parseMetadata(rawContent);

        let wordCount = 0;
        for (const line of contentWithoutFrontmatter.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("# ") || trimmed.startsWith("@ ")) {
                continue;
            }
            wordCount += trimmed.split(/\s+/).length;
        }

        const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
        this.statusBarItemEl.setText(`🎬 ${minutes} min`);
        this.statusBarItemEl.show();
    }
}
