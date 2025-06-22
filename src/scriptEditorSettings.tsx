import ScriptEditorPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export interface ScriptEditorSettings {
    characterFolder: string;
}

export const DEFAULT_SETTINGS: Partial<ScriptEditorSettings> = {
    characterFolder: "Characters"
};

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
            });
    }
}