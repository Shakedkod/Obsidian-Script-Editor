import { getLanguage, Plugin, WorkspaceLeaf } from "obsidian";

import { ScriptEditorView, SCRIPT_EDITOR_VIEW_TYPE } from "./ScriptView";
import { i18n } from "./i18n/i18n";

export default class ScriptEditorPlugin extends Plugin
{
    private view: ScriptEditorView;

    async onload(): Promise<void>
    {
        i18n.setLanguageFromString(getLanguage());

        this.registerView(
            SCRIPT_EDITOR_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => (this.view = new ScriptEditorView(leaf))
        );
        this.registerExtensions(["script"], SCRIPT_EDITOR_VIEW_TYPE);

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
