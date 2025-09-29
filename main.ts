import { getLanguage, Notice, Plugin } from 'obsidian';
import { ScriptView, SCRIPT_VIEW_TYPE } from "./src/ScriptView";
import { ScriptNameModal } from "./src/scriptCreatorModel";
import ScriptEditorSettingsTab, { DEFAULT_SETTINGS, ScriptEditorSettings } from 'src/scriptEditorSettings';
import { i18n } from 'src/i18n/i18n';

export default class ScriptEditorPlugin extends Plugin {
	private scriptMode: "preview" | "source" | "metadata" = "preview";
	settings: ScriptEditorSettings;
	statusBarItemEl: HTMLElement | undefined;

	updateRuntimeEstimate = () => {
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
	};

	async onload() {
		await this.loadSettings();
		i18n.setLanguageFromString(getLanguage());

		this.registerView(
			SCRIPT_VIEW_TYPE,
			(leaf) => new ScriptView(leaf, this)
		);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.updateRuntimeEstimate();
			})
		);

		// Add a command to create a new script file
		this.addCommand({
			id: 'create-new-script',
			name: 'Create new script',
			callback: async () => {
				new ScriptNameModal(this.app, async (name, subtitle, writers, prodCompany, date, characterFolder) => {
					const safeName = name.replace(/[\\/:*?"<>|]/g, '-');
					const fileName = `${safeName}.script`;

					try {
						const file = await this.app.vault.create(fileName, `---\ntitle: ${name}\nsubtitle: ${subtitle}\nwriters: ${writers}\nprod_company: ${prodCompany}\ndate: ${date}\ncharacterFolder: ${characterFolder}\n---\n`);
						const leaf = this.app.workspace.getLeaf(true);
						await leaf.openFile(file);
					} catch (err) {
						new Notice("Failed to create file: " + err.message);
					}
				}).open();
			}
		});

		this.addCommand({
			id: "toggle-preview-mode",
			name: "Toggle preview mode",
			callback: () => {
				// call a method to toggle view mode
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptView);
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
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptView);
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
				const activeLeaf = this.app.workspace.getActiveViewOfType(ScriptView);
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

		// Automatically open the script view for .script files
		this.registerExtensions(["script"], SCRIPT_VIEW_TYPE);

		// Settings
		this.addSettingTab(new ScriptEditorSettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
	}
}