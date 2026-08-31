import * as React from "react";
import { useEffect, useState } from "react";
import { getCharacterList, parseMetadata } from "../services/scriptParsing";
import { App, stringifyYaml, TFile } from "obsidian";
import { getTextDirection, i18n } from "../i18n/i18n";
import ScriptViewWriter from "./components/ScriptWriter";
import MetadataPage from "./components/MetadataPage";
import { ScriptMetadata } from "src/models/ScriptMetadata";

interface Props {
    app: App;
    file: TFile;
    setData: (data: string) => void;
    characterFolder: string;
    openCharacterNote: (name: string) => void;
    setModeCallback: (cb: (mode: "preview" | "source" | "metadata") => void) => void;
}

function _ScriptEditor({ app, file, setData, characterFolder, setModeCallback, openCharacterNote }: Props): JSX.Element 
{
    // Text and file vars
    const [fullFile, setFullFile] = useState("");
    const [scriptContent, setScriptContent] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({
        title: "",
        writers: "inherit",
        prodCompany: "inherit",
        date: "inherit",
        characterFolder: "inherit",
        locationFolder: "inherit"
    });

    // Editor vars
    const [mode, setMode] = useState<"preview" | "source" | "metadata">("preview");
    const [characterSuggestionsOpen, setCharacterSuggestionsOpen] = useState(false);
    const [suggestionAnchor, setSuggestionAnchor] = useState<{ top: number; left: number } | null>(null);
    const [characterSuggestionSelectedIndex, setCharacterSuggestionSelectedIndex] = useState(0);
    const [characterQuery, setCharacterQuery] = useState("");
    const [filteredCharacters, setFilteredCharacters] = useState<string[]>([]);

    // Set mode callback
    useEffect(() => {
        setModeCallback(setMode);
    }, [setModeCallback]);

    // Inner functions
    function updateFullText(newMetadata: ScriptMetadata, newScriptContent: string): void 
    {
        // Only add frontmatter if there's actual metadata content
        const hasMetadata = Object.values(newMetadata).some(value => value !== "");

        let newFullText: string;
        if (hasMetadata) {
            const frontmatter = stringifyYaml(newMetadata);
            newFullText = `---\n${frontmatter}---\n${newScriptContent}`;
        } else {
            newFullText = newScriptContent;
        }

        setFullFile(newFullText);
        setData(newFullText);
    }

    function updateSource(newFullText: string): void
    {
        setFullFile(newFullText);
        setData(newFullText);
    }

    // Load file
    useEffect(() => {
        app.vault.read(file).then(setFullFile);
    }, [file]);

    // Parse text into metadata and content whenever fullText changes
    useEffect(() => {
        const parsed = parseMetadata(fullFile);
        setMetadata(parsed.metadata);
        setScriptContent(parsed.contentWithoutFrontmatter);
    }, [fullFile]);


    useEffect(() => {
        setFilteredCharacters(
            getCharacterList(app, metadata, characterFolder)
                .filter(c => c.toLowerCase().startsWith(characterQuery.toLowerCase()))
        );
    }, [characterQuery]);

    return (
        <div className="se-root">
            {/* Title */}
            <div className="se-header" dir={getTextDirection(metadata.title)}>
                <h2 className="se-title">
                    {metadata.title || "Untitled Script"} {metadata.subtitle && `- ${metadata.subtitle}`}
                </h2>
                {mode === "metadata" && (
                    <h2 className="se-meta-title">
                        {i18n.t("scriptEditor.properties")}
                    </h2>
                )}
            </div>

            {/* TODO character suggestion */}

            {/* Page */}
            {mode === "metadata"
                ? <MetadataPage 
                    metadata={metadata}
                    updateMetadata={(newMetadata: ScriptMetadata) => {
                        setMetadata(newMetadata);
                        updateFullText(newMetadata, scriptContent);
                    }}
                />
                : <ScriptViewWriter 
                    key = {mode}
                    value = {(mode === "source") ? fullFile : scriptContent}
                    onChange = {(newText: string) => {
                        if (mode === "source")
                            updateSource(newText)
                        else
                            updateFullText(metadata, newText);
                    }}
                    livePreview = {mode === "preview"}
                />
            }
        </div>
    );
}


export default function ScriptEditor({ app, file, setData, characterFolder, setModeCallback, openCharacterNote }: Props): () => JSX.Element {
    return () => (
        <>
            <_ScriptEditor
                app={app}
                file={file}
                setData={setData}
                characterFolder={characterFolder}
                setModeCallback={setModeCallback}
                openCharacterNote={openCharacterNote}
            />
        </>
    );
}