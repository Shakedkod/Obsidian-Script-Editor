import { getLanguage, Notice, Plugin, WorkspaceLeaf } from "obsidian";

import { ScriptEditorView, SCRIPT_EDITOR_VIEW_TYPE } from "./ScriptView";
import { i18n } from "./i18n/i18n";

export default class ScriptEditorPlugin extends Plugin
{
    private view: ScriptEditorView;
    private scriptMode: "preview" | "source" | "metadata" = "preview";
    statusBarItemEl: HTMLElement | undefined;

    // Estimate script reading time
    updateRuntimeEstimate(): void
    {
		if (this.statusBarItemEl) {
			this.statusBarItemEl.remove();
			this.statusBarItemEl = undefined;
		}

		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== "script") return;

		this.app.vault.read(activeFile).then((content) => {
			const lines = content.split("\n");

			let wordCount = 0;
			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;
				// You may want to skip character or scene headings here
				wordCount += trimmed.split(/\s+/).length;
			}

			const minutes = Math.max(1, Math.round(wordCount / 130));

			if (!this.statusBarItemEl) {
				this.statusBarItemEl = this.addStatusBarItem();
			}

			this.statusBarItemEl.setText(`🎬 ${minutes} min`);
		});
	}

    async onload(): Promise<void>
    {
        i18n.setLanguageFromString(getLanguage());

        this.registerView(
            SCRIPT_EDITOR_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => (this.view = new ScriptEditorView(leaf))
        );
        this.registerExtensions(["script"], SCRIPT_EDITOR_VIEW_TYPE);

        this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.updateRuntimeEstimate();
			})
		);

        // Script Mode Change
        this.addCommand({
			id: "toggle-preview-mode",
			name: "Toggle preview mode",
			callback: () => {
				// call a method to toggle view mode
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptEditorView);
				if (activeLeaf) {
					this.scriptMode = this.scriptMode === "preview" ? "source" : "preview";
					activeLeaf.setMode(this.scriptMode);
				}
			},
		});

		this.addCommand({
			id: "edit-script-metadata",
			name: "Edit script metadata",
			callback: () => {
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptEditorView);
				if (activeLeaf) {
					this.scriptMode = this.scriptMode === "metadata" ? "preview" : "metadata";
					activeLeaf.setMode(this.scriptMode);
				} else {
					new Notice("No script view is currently active.");
				}
			},
		});

        this.addCommand({
			id: "export-script-to-pdf",
			name: "Export script to PDF",
			callback: async () => {
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptEditorView);
				if (activeLeaf) {
					try {
						await activeLeaf.exportToPDF();
						new Notice("Script exported to PDF successfully.");
					} catch (error) {
						new Notice("Failed to export script: " + error.message);
					}
				} else {
					new Notice("No script view is currently active.");
				}
			},
		});

        this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
    }

    onLayoutReady(): void
    {
        if (this.app.workspace.getLeavesOfType(SCRIPT_EDITOR_VIEW_TYPE).length)  return;

        this.app.workspace.getRightLeaf(false).setViewState({
            type: SCRIPT_EDITOR_VIEW_TYPE,
        });
    }
}
