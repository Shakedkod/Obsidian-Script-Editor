import { Modal, App, TextComponent, ButtonComponent } from 'obsidian';
import React from 'react';
import { useState } from 'react';
import * as ReactDOM from 'react-dom/client';

type Props = {
    onSubmit: (name: string, subtitle: string, writers: string, prodCompany: string, date: string) => void;
    onClose: () => void;
};

export const ScriptNameModalContent: React.FC<Props> = ({ onSubmit, onClose }) => {
    const [name, setName] = useState("");
    const [subtitle, setSubtitle] = useState(""); // Optional subtitle
    const [writers, setWriters] = useState("");
    const [prodCompany, setProdCompany] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date

    const handleSubmit = () => {
        if (name.trim()) {
            onSubmit(name.trim(), subtitle.trim(), writers.trim(), prodCompany.trim(), date.trim());
        }
    };

    return (
        <div style={{"padding":"0.5rem"}}>
            <h2 style={{"marginBottom":"2rem","fontSize":"1.125rem","lineHeight":"1.75rem","fontWeight":700,textAlign:"center"}}>
                New Script
            </h2>
            <input
                type="text"
                style={{"padding":"0.5rem","marginBottom":"1rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%"}}
                placeholder="Enter script name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
                type="text"
                style={{"padding":"0.5rem","marginBottom":"1rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%"}}
                placeholder="Enter script subtitle (optional)"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
                type="text"
                style={{"padding":"0.5rem","marginBottom":"1rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%"}}
                placeholder="Enter script author"
                value={writers}
                onChange={(e) => setWriters(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
                type="text"
                style={{"padding":"0.5rem","marginBottom":"1rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%"}}
                placeholder="Enter production company"
                value={prodCompany}
                onChange={(e) => setProdCompany(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
                type="date"
                style={{"padding":"0.5rem","marginBottom":"1rem", "paddingLeft":"1.5rem","borderRadius":"0.25rem","borderWidth":"1px","width":"100%"}}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <div style={{"display":"flex","justifyContent":"center","gap":"0.5rem"}}>
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
        </div>
    );
};

class ScriptNameModal extends Modal 
{
    private root: ReactDOM.Root;
    onSubmit: (name: string, subtitle: string, writers: string, prodCompany: string, date: string) => void;

    constructor(app: App, onSubmit: (name: string, subtitle: string, writers: string, prodCompany: string, date: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        this.root = ReactDOM.createRoot(this.contentEl);
        this.root.render(
            <ScriptNameModalContent
                onSubmit={(name: string, subtitle: string, writers: string, prodCompany: string, date: string) => {
                    this.onSubmit(name, subtitle, writers, prodCompany, date);
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