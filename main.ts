import { Notice, Plugin } from 'obsidian';
import { ScriptView, SCRIPT_VIEW_TYPE } from "./src/ScriptView";
import { ScriptNameModal } from "./src/scriptCreatorModel";

export default class MyPlugin extends Plugin {
	async onload() {
		this.registerView(
			SCRIPT_VIEW_TYPE,
			(leaf) => new ScriptView(leaf)
		);

		// Add a command to create a new script file
		this.addCommand({
			id: 'create-new-script',
			name: 'Create New Script',
			callback: async () => {
				new ScriptNameModal(this.app, async (name, author, prodCompany, date) => {
					const safeName = name.replace(/[\\/:*?"<>|]/g, '-');
					const fileName = `${safeName}.script`;

					try {
						const file = await this.app.vault.create(fileName, `---\ntitle: ${name}\nauthor: ${author}\nprod_company: ${prodCompany}\ndate: ${date}\n---\n`);
						const leaf = this.app.workspace.getLeaf(true);
						await leaf.openFile(file);
					} catch (err) {
						new Notice("Failed to create file: " + err.message);
					}
				}).open();
			}
		});

		// Automatically open the script view for .script files
		this.registerExtensions(["script"], SCRIPT_VIEW_TYPE);
	}

	onunload() {
		// Cleanup if necessary
		this.app.workspace.detachLeavesOfType(SCRIPT_VIEW_TYPE);
	}
}