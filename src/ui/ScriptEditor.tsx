import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { parseMetadata, serializeScript } from "../services/scriptParsing";
import { getTextDirection, i18n } from "../i18n/i18n";
import ScriptViewWriter from "./components/ScriptWriter";
import MetadataPage from "./components/MetadataPage";
import { DEFAULT_METADATA, ScriptMetadata } from "../models/ScriptMetadata";

export type EditorMode = "preview" | "source" | "metadata";

interface Props {
    data: string;
    mode: EditorMode;
    onChange: (data: string) => void;
}

export default function ScriptEditor({ data, mode, onChange }: Props): JSX.Element {
    const [fullFile, setFullFile] = useState(data);
    const [scriptContent, setScriptContent] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({ ...DEFAULT_METADATA });
    const lastEmittedData = useRef(data);

    useEffect(() => {
        if (data === lastEmittedData.current && fullFile !== "") {
            return;
        }
        lastEmittedData.current = data;
        setFullFile(data);

        const parsed = parseMetadata(data);
        setMetadata(parsed.metadata);
        setScriptContent(parsed.contentWithoutFrontmatter);
    }, [data]);

    function handleStructuredChange(newMetadata: ScriptMetadata, newScriptContent: string): void {
        const newFullText = serializeScript(newMetadata, newScriptContent);
        lastEmittedData.current = newFullText;

        setMetadata(newMetadata);
        setScriptContent(newScriptContent);
        setFullFile(newFullText);
        onChange(newFullText);
    }

    function handleSourceChange(newFullText: string): void {
        lastEmittedData.current = newFullText;
        const parsed = parseMetadata(newFullText);

        setFullFile(newFullText);
        setMetadata(parsed.metadata);
        setScriptContent(parsed.contentWithoutFrontmatter);
        onChange(newFullText);
    }

    return (
        <div className="se-root">
            <div className="se-header" dir={getTextDirection(metadata.title)}>
                <h2 className="se-title">
                    {metadata.title || "Untitled Script"}{" "}
                    {metadata.subtitle && `- ${metadata.subtitle}`}
                </h2>
                {mode === "metadata" && (
                    <h2 className="se-meta-title">{i18n.t("scriptEditor.properties")}</h2>
                )}
            </div>

            {mode === "metadata" ? (
                <MetadataPage
                    metadata={metadata}
                    updateMetadata={(newMetadata) =>
                        handleStructuredChange(newMetadata, scriptContent)
                    }
                />
            ) : (
                <ScriptViewWriter
                    key={mode}
                    value={mode === "source" ? fullFile : scriptContent}
                    onChange={(newText) => {
                        if (mode === "source") {
                            handleSourceChange(newText);
                        } else {
                            handleStructuredChange(metadata, newText);
                        }
                    }}
                    livePreview={mode === "preview"}
                />
            )}
        </div>
    );
}
