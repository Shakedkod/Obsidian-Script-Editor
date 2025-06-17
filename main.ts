import { Plugin } from 'obsidian';
import { ScriptView, SCRIPT_VIEW_TYPE } from "./src/ScriptView";

export default class MyPlugin extends Plugin 
{
	async onload() 
	{
		this.registerView(
			SCRIPT_VIEW_TYPE,
			(leaf) => new ScriptView(leaf)
		);

		// Add a command to create a new script file
		this.addCommand({
			id: 'create-new-script',
			name: 'Create New Script',
			callback: () => {
				const fileName = `New Script ${new Date().toLocaleDateString()}.script`;
				console.log(`Creating new script file: ${fileName}`);
				this.app.vault.create(fileName, "");
			}
		});

		// Automatically open the script view for .script files
		this.registerExtensions(["script"], SCRIPT_VIEW_TYPE);
	}

	onunload() 
	{
		// Cleanup if necessary
		this.app.workspace.detachLeavesOfType(SCRIPT_VIEW_TYPE);
	}
}