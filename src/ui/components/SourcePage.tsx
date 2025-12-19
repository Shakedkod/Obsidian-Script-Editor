import { App } from "obsidian";
import React from "react";

interface SourcePageProps
{
    fullText: string;
    updateSource: (newText: string) => void;
}

export default function SourcePage({ fullText, updateSource }: SourcePageProps): JSX.Element
{
    return (
        <div className="SE-page-container">
            <textarea
                className="SE-SP-textarea"
                value={fullText}
                onChange={(e) => updateSource(e.target.value)}
            />
        </div>
    );
}