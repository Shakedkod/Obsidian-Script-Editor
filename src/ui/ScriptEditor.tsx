import * as React from "react";
import { useEffect, useState } from "react";
import { getCharacterList, parseMetadata } from "../services/scriptParsing";
import { App, stringifyYaml, TFile } from "obsidian";
import { ScriptMetadata } from "../models/ScriptModel";
import { getTextDirection, i18n } from "../i18n/i18n";
import ViewPage from "./components/ViewPage";
import SourcePage from "./components/SourcePage";
import MetadataPage from "./components/MetadataPage";

interface Props
{
    app: App;
    file: TFile;
    setData: (data: string) => void;
    characterFolder: string;
    openCharacterNote: (name: string) => void;
}

function _ScriptEditor({app, file, setData, characterFolder, openCharacterNote}: Props): JSX.Element
{
    // Text and file vars
    const [fullFile, setFullFile] = useState("");
    const [scriptContent, setScriptContent] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({
        title: "",
        writers: "",
        prod_company: "",
        date: "",
        characterFolder: "", //characterFolder,
    });

    // Editor vars
    const [mode, setMode] = useState<"preview" | "source" | "metadata">("preview");
    const [characterSuggestionsOpen, setCharacterSuggestionsOpen] = useState(false);
    const [suggestionAnchor, setSuggestionAnchor] = useState<{ top: number; left: number } | null>(null);
    const [characterSuggestionSelectedIndex, setCharacterSuggestionSelectedIndex] = useState(0);
    const [characterQuery, setCharacterQuery] = useState("");
    const [filteredCharacters, setFilteredCharacters] = useState<string[]>([]);

    // Inner functions
    function updateFullText(newMetadata: ScriptMetadata, newScriptContent: string): void
    {
        const frontmatter = stringifyYaml(newMetadata);
        const newFullText = frontmatter + newScriptContent;
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
    
    useEffect(() =>
    {
        setData(fullFile);
    }, [fullFile]);

    useEffect(() =>
    {
        setFilteredCharacters(
            getCharacterList(app, metadata, characterFolder)
                .filter(c => c.toLowerCase().startsWith(characterQuery.toLowerCase()))
        );
    }, [characterQuery]);

    return (
        <div className="SE-container">
            {/* Title */}
            <div className="SE-title-container" dir={getTextDirection(metadata.title)}>
                <h2 className="SE-title">
                    {metadata.title || "Untitled Script"} {metadata.subtitle && `- ${metadata.subtitle}`}
                </h2>
                {mode === "metadata" && (
                    <h2 className="SE-MP-title">
                        {i18n.t("scriptEditor.properties")}
                    </h2>
                )}
            </div>

            {/* TODO character suggestion */}

            {/* Page */}
            {mode === "metadata"
                ? <MetadataPage/>
                : (mode === "source")
                    ? <SourcePage/>
                    : (
                        <ViewPage
                            app={app}
                            filePath={file.path}
                            lines={scriptContent.split("\n")}
                            setScriptContent={setScriptContent}
                            updateFullText={(newContent: string) => updateFullText(metadata, newContent)}
                            setCharacterSuggestionsOpen={setCharacterSuggestionsOpen}
                            setSuggestionAnchor={setSuggestionAnchor}
                            characterSuggestionOpen={characterSuggestionsOpen}
                            characters={filteredCharacters}
                            characterQuery={characterQuery}
                            setCharacterQuery={setCharacterQuery}
                            openCharacterNote={openCharacterNote}
                            metadata={metadata}
                            characterFolder={characterFolder}
                        />
                    )
            }
        </div>
    );
}


export default function ScriptEditor({app, file, setData, characterFolder, openCharacterNote}: Props): () => JSX.Element
{
    return () => (
        <>
            <_ScriptEditor
                app={app}
                file={file}
                setData={setData}
                characterFolder={characterFolder}
                openCharacterNote={openCharacterNote}
            />
        </>
    );
}