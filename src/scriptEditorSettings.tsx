import ScriptEditorPlugin from "main";
import { App, PluginSettingTab, Setting, TextComponent, TFolder } from "obsidian";

export interface ScriptEditorSettings {
    characterFolder: string;
}

export const DEFAULT_SETTINGS: Partial<ScriptEditorSettings> = {
    characterFolder: "Characters"
};

export class FolderSuggest {
    constructor(app: App, input: TextComponent) {
        const vault = app.vault;

        // Bind Obsidian's fuzzy suggest
        // @ts-ignore (internal API)
        const suggest = app.plugins.plugins["nldates-obsidian"]?.suggest || app.scope?.suggest;

        if (suggest) {
            suggest(input.inputEl, async (query: string) => {
                return vault.getAllLoadedFiles()
                    .filter((file) => file instanceof TFolder && file.path.toLowerCase().includes(query.toLowerCase()))
                    .map((folder: TFolder) => ({
                        item: folder.path,
                        title: folder.path,
                    }));
            }, async (item: string) => {
                input.setValue(item);
                input.inputEl.trigger("input");
            });
        }
    }
}

export default class ScriptEditorSettingsTab extends PluginSettingTab {
    plugin: ScriptEditorPlugin;

    constructor(app: App, plugin: ScriptEditorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Script Editor Settings" });

        new Setting(containerEl)
            .setName("Character folder")
            .setDesc("Folder containing character notes")
            .addText((text) => {
                text
                    .setPlaceholder("e.g. Characters")
                    .setValue(this.plugin.settings.characterFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.characterFolder = value.trim();
                        await this.plugin.saveSettings();
                    });

                // Add folder suggest
                new FolderSuggest(this.app, text);
            });
    }
}