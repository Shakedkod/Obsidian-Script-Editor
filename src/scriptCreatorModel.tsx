import { Modal, App, TextComponent, ButtonComponent } from 'obsidian';
import React from 'react';
import { useState } from 'react';
import * as ReactDOM from 'react-dom/client';

type Props = {
    onSubmit: (name: string) => void;
    onClose: () => void;
};

export const ScriptNameModalContent: React.FC<Props> = ({ onSubmit, onClose }) => {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name.trim());
        }
    };

    return (
        <div style={{"padding":"0.5rem"}}>
            <h2 style={{"marginBottom":"2rem","fontSize":"1.125rem","lineHeight":"1.75rem","fontWeight":700}}>
                New Script
            </h2>
            <input
                type="text"
                style={{"padding":"0.5rem","marginBottom":"1rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%","color":"#000000"}}
                placeholder="Enter script name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <button
                onClick={handleSubmit}
                style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","marginRight":"0.5rem","borderRadius":"0.25rem","color":"#ffffff","backgroundColor":"#2563EB"}}
            >
                Create
            </button>
            <button onClick={onClose} style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","color":"#D1D5DB"}}>
                Cancel
            </button>
        </div>
    );
};

class ScriptNameModal extends Modal 
{
    private root: ReactDOM.Root;
    onSubmit: (value: string) => void;

    constructor(app: App, onSubmit: (value: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        this.root = ReactDOM.createRoot(this.contentEl);
        this.root.render(
            <ScriptNameModalContent
                onSubmit={(name) => {
                    this.onSubmit(name);
                    this.close();
                }}
                onClose={() => this.close()}
            />
        );
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
        }
        this.contentEl.empty();
    }
}

export { ScriptNameModal };