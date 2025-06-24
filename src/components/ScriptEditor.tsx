import React, { useEffect, useState, useRef, JSX } from "react";
import { TFile, App, TFolder } from "obsidian";
import { scriptLineToReact, parseLine, ScriptMetadata, parseMetadata, serializeFrontmatter, isScene } from "src/scriptParser";
import { i18n, isRTL } from "src/i18n/i18n";

function getTextDirection(text: string): 'rtl' | 'ltr' {
    return isRTL(text) ? 'rtl' : 'ltr';
}

interface Props {
    file: TFile;
    app: App;
    characterFolder: string;
    setData: (data: string) => void;
    setModeCallback: (cb: (mode: "preview" | "source" | "metadata") => void) => void;
    openCharacterNote: (name: string) => void;
}

export function ScriptEditor({ file, app, characterFolder, setData, setModeCallback, openCharacterNote }: Props): JSX.Element {
    const [fullText, setFullText] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({
        title: "",
        writers: "",
        prod_company: "",
        date: "",
        characterFolder: characterFolder,
    });
    const [scriptContent, setScriptContent] = useState("");
    const [mode, setMode] = useState<"preview" | "source" | "metadata">("preview");
    const [activeLine, setActiveLine] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [characterSuggestionsOpen, setCharacterSuggestionsOpen] = useState(false);
    const [characterQuery, setCharacterQuery] = useState('');
    const [suggestionAnchor, setSuggestionAnchor] = useState<{ top: number; left: number } | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Set initial mode and callback
    useEffect(() => {
        setModeCallback(setMode);
    }, [setModeCallback]);

    // Parse text into metadata and content whenever fullText changes
    useEffect(() => {
        const parsed = parseMetadata(fullText);
        setMetadata(parsed.metadata);
        setScriptContent(parsed.contentWithoutFrontmatter);
    }, [fullText]);

    // Load file
    useEffect(() => {
        app.vault.read(file).then(setFullText);
    }, [file]);

    // Update full text when metadata or script content changes
    const updateFullText = (newMetadata: ScriptMetadata, newScriptContent: string) => {
        const frontmatter = serializeFrontmatter(newMetadata);
        const newFullText = frontmatter + newScriptContent;
        setFullText(newFullText);
        setData(newFullText);
    };

    const handleMetadataChange = (field: keyof ScriptMetadata, value: string) => {
        const newMetadata = { ...metadata, [field]: value };
        setMetadata(newMetadata);
        updateFullText(newMetadata, scriptContent);
    };

    const handleScriptContentChange = (newContent: string) => {
        setScriptContent(newContent);
        updateFullText(metadata, newContent);
    };

    const lines = scriptContent.split("\n");

    // Calculate scene numbers for all lines
    const getSceneNumbers = () => {
        const sceneNumbers: { [lineIndex: number]: number } = {};
        let currentSceneNumber = 0;

        lines.forEach((line, index) => {
            const parsed = parseLine(line);
            if (isScene(parsed)) {
                currentSceneNumber++;
                sceneNumbers[index] = currentSceneNumber;
            }
        });

        return sceneNumbers;
    };

    const sceneNumbers = getSceneNumbers();

    const renderScriptLine = (line: string, lineIndex: number) => {
        const parsed = parseLine(line);
        if (isScene(parsed)) {
            const sceneNumber = sceneNumbers[lineIndex] || 1;
            const totalScenes = Math.max(...Object.values(sceneNumbers), 1);
            const totalDigits = totalScenes.toString().length;

            return (
                <div style={{
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    marginTop: '1em',
                    marginBottom: "1em",
                    display: 'inline-block',
                    width: '100%',
                    direction: getTextDirection(parsed.heading),
                    textAlign: getTextDirection(parsed.heading) === 'rtl' ? 'right' : 'left',
                }}>
                    {`${sceneNumber.toString().padStart(totalDigits, "0")}\t${parsed.heading}`}
                </div>
            );
        } else {
            return scriptLineToReact(line, 0, () => { }, openCharacterNote);
        }
    };

    const handleLineChange = (i: number, newText: string) => {
        const newLines = [...lines];
        newLines[i] = newText;
        const updatedContent = newLines.join("\n");
        handleScriptContentChange(updatedContent);
    };

    const resizeTextarea = (el: HTMLTextAreaElement | null) => {
        if (el) {
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
        }
    }

    const insertCharacterAtCursor = async (name: string) => {
        const newLine = lines[activeLine ?? 0].replace(/@([\p{L}\p{N}_]*)$/u, `@${name}`);
        handleLineChange(activeLine!, newLine);

        setCharacterSuggestionsOpen(false);
        setCharacterQuery('');
        setSelectedIndex(0);

        const safeName = name.normalize("NFC");
        const exists = getCharacterList().some(c =>
            c.normalize("NFC").toLowerCase() === safeName.toLowerCase()
        );

        if (!exists) {
            const folderPath = metadata.characterFolder || characterFolder;
            const folder = app.vault.getAbstractFileByPath(folderPath);

            if (folder instanceof TFolder) {
                const filePath = `${folderPath}/${safeName}.md`;
                if (!app.vault.getAbstractFileByPath(filePath)) {
                    await app.vault.create(filePath, "");
                    console.log("🆕 Created new character:", safeName);
                }
            }
        }
    };

    const getCharacterList = (): string[] => {
        const folder = app.vault.getAbstractFileByPath(metadata.characterFolder || characterFolder);
        if (!(folder instanceof TFolder)) {
            return [];
        }
        return folder.children
            .filter(file => file instanceof TFile && file.extension === 'md')
            .map(file => (file as TFile).basename);
    };

    const filteredCharacters = getCharacterList().filter(c =>
        c.toLowerCase().startsWith(characterQuery.toLowerCase())
    );

    return (
        <div style={{ "padding": "1rem", "width": "100%", "height": "100%", "fontFamily": "Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace" }}>
            {/* Title */}
            <div style={{ "display": "flex", "justifyContent": "space-between" }} dir={getTextDirection(metadata.title)}>
                <h2 style={{ "marginTop": "0", "marginBottom": "1rem", "fontSize": "1.5rem", "borderBottom": "1px solid #CCCCCCFF", "paddingBottom": "0.5rem" }}>
                    {metadata.title || "Untitled Script"} {metadata.subtitle && `- ${metadata.subtitle}`}
                </h2>
                {mode === "metadata" && (
                    <h2 style={{ "marginTop": "0", "marginBottom": "1rem", "fontSize": "1.5rem", "color": "#D1D5DB" }}>
                        {i18n.t("scriptEditor.properties")}
                    </h2>
                )}
            </div>

            {characterSuggestionsOpen && suggestionAnchor && (
                <div
                    style={{
                        position: 'fixed',
                        top: suggestionAnchor.top,
                        left: suggestionAnchor.left,
                        backgroundColor: 'var(--background-secondary)',
                        border: '1px solid var(--background-modifier-border)',
                        borderRadius: '4px',
                        zIndex: 999,
                        padding: '0.5rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                >
                    {filteredCharacters.map((char, idx) => (
                        <div
                            key={char}
                            style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', backgroundColor: idx === selectedIndex ? "var(--interactive-accent)" : "transparent" }}
                            onClick={() => insertCharacterAtCursor(char)}
                        >
                            {char}
                        </div>
                    ))}
                    {!filteredCharacters.includes(characterQuery) && (
                        <div
                            style={{ padding: '0.25rem 0.5rem', cursor: 'pointer', fontStyle: 'italic' }}
                            onClick={() => insertCharacterAtCursor(characterQuery)}
                        >
                            Create new character: "{characterQuery}"
                        </div>
                    )}
                </div>
            )}

            {/* Actual Page */}
            {mode === "metadata" ? (
                <div style={{ "padding": "1rem", "borderRadius": "0.5rem", "height": "80vh", "overflowY": "auto" }}>
                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Title:</label>
                        <input
                            type="text"
                            value={metadata.title}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": 'var(--background-secondary)', "border": "1px solid var(--background-modifier-border)", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter script title"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Subtitle:</label>
                        <input
                            type="text"
                            value={metadata.subtitle || ""}
                            onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "var(--background-secondary)", "border": "1px solid var(--background-modifier-border)", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter script subtitle (optional)"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Writers:</label>
                        <input
                            type="text"
                            value={metadata.writers}
                            onChange={(e) => handleMetadataChange('writers', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "var(--background-secondary)", "border": "1px solid var(--background-modifier-border)", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter author name"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Production Company:</label>
                        <input
                            type="text"
                            value={metadata.prod_company || ""}
                            onChange={(e) => handleMetadataChange('prod_company', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "var(--background-secondary)", "border": "1px solid var(--background-modifier-border)", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter production company"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Date:</label>
                        <input
                            type="date"
                            value={metadata.date}
                            onChange={(e) => handleMetadataChange('date', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "paddingLeft": "1.5rem", "backgroundColor": "var(--background-secondary)", "border": "1px solid var(--background-modifier-border)", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter date (e.g., 2024-01-15)"
                        />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", color: "#D1D5DB", fontWeight: "bold" }}>
                            Character Folder:
                        </label>
                        <input
                            type="text"
                            value={metadata.characterFolder}
                            onChange={(e) => handleMetadataChange("characterFolder", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.5rem",
                                backgroundColor: "var(--background-secondary)",
                                border: "1px solid var(--background-modifier-border)",
                                borderRadius: "0.25rem",
                                fontFamily: "inherit",
                            }}
                            placeholder="e.g. Characters/Script1"
                        />
                    </div>

                    <div style={{ "marginTop": "2rem", "padding": "1rem", "backgroundColor": "var(--background-secondary)", "borderRadius": "0.25rem" }}>
                        <h4 style={{ "marginTop": "0", "marginBottom": "0.5rem", "color": "#D1D5DB" }}>Preview:</h4>
                        <pre style={{ "margin": "0", "fontSize": "0.875rem", "whiteSpace": "pre-wrap" }}>
                            {serializeFrontmatter(metadata) || "No metadata to display"}
                        </pre>
                    </div>
                </div>
            ) : mode === "source" ? (
                <textarea
                    style={{ "padding": "1rem", "width": "100%", "resize": "none", "height": "80vh", "fontFamily": "inherit", fontSize: "1em", backgroundColor: "transparent", border: "none", "outline": "none", "boxShadow": "none" }}
                    value={fullText}
                    onChange={(e) => setFullText(e.target.value)}
                    spellCheck={false}
                    placeholder="Enter your script content here..."
                />
            ) : (
                <div ref={containerRef} style={{ "display": "flex", "flexDirection": "column", "minHeight": "80vh", "padding": "1rem", "backgroundColor": "transparent" }}>
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            style={{ "minHeight": "1.5rem", "lineHeight": "1.5rem", "cursor": "text", "padding": "0", "margin": "0", "backgroundColor": "transparent" }}
                            onClick={() => setActiveLine(i)}
                        >
                            {activeLine === i ? (
                                <textarea
                                    ref={resizeTextarea}
                                    onInput={(e) => resizeTextarea(e.target as HTMLTextAreaElement)}
                                    value={line}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        handleLineChange(i, e.target.value)

                                        const cursorIndex = e.target.selectionStart ?? 0;
                                        const textBeforeCursor = value.slice(0, cursorIndex);
                                        const match = textBeforeCursor.match(/@([\p{L}\p{N}_]*)$/u); // match @ and character name

                                        if (match) {
                                            const query = match[1];
                                            setCharacterQuery(query);
                                            setCharacterSuggestionsOpen(true);

                                            const rect = e.target.getBoundingClientRect();
                                            setSuggestionAnchor({ top: rect.bottom, left: rect.left + cursorIndex * 8 });
                                        }
                                        else
                                            setCharacterSuggestionsOpen(false);
                                    }}
                                    onBlur={() => setActiveLine(null)}
                                    dir={getTextDirection(line)}
                                    onKeyDown={(e) => {
                                        if (characterSuggestionsOpen) {
                                            if (e.key === "ArrowDown") {
                                                e.preventDefault();
                                                setSelectedIndex((prev) => (prev + 1) % filteredCharacters.length);
                                                return;
                                            }
                                            if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                setSelectedIndex((prev) =>
                                                    (prev - 1 + filteredCharacters.length) % filteredCharacters.length
                                                );
                                                return;
                                            }
                                            if (e.key === "Tab" || e.key === "Enter") {
                                                e.preventDefault();
                                                const selected = filteredCharacters[selectedIndex] || characterQuery;
                                                insertCharacterAtCursor(selected);
                                                return;
                                            }
                                            if (e.key === "Escape") {
                                                e.preventDefault();
                                                setCharacterSuggestionsOpen(false);
                                                return;
                                            }

                                        }
                                        else {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const newLines = [...lines];
                                                newLines.splice(i + 1, 0, '');
                                                const updatedContent = newLines.join('\n');
                                                handleScriptContentChange(updatedContent);
                                                setTimeout(() => setActiveLine(i + 1), 0);
                                            }
                                            if (e.key === 'Escape') {
                                                setActiveLine(null);
                                            }
                                            if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                if (i > 0) {
                                                    setActiveLine(i - 1);
                                                }
                                            }
                                            if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                if (i < lines.length - 1) {
                                                    setActiveLine(i + 1);
                                                }
                                            }
                                            if (e.key === 'Backspace' && line === '' && lines.length > 1) {
                                                e.preventDefault();
                                                const newLines = [...lines];
                                                newLines.splice(i, 1);
                                                const updatedContent = newLines.join('\n');
                                                handleScriptContentChange(updatedContent);
                                                if (i > 0) {
                                                    setTimeout(() => setActiveLine(i - 1), 0);
                                                } else {
                                                    setActiveLine(null);
                                                }
                                            }
                                        }
                                    }}
                                    autoFocus
                                    rows={1}
                                    style={{
                                        width: "100%",
                                        backgroundColor: "transparent",
                                        border: "none",
                                        outline: "none",
                                        boxShadow: "none",
                                        fontFamily: "inherit",
                                        fontSize: "inherit",
                                        padding: "0",
                                        margin: "0",
                                        resize: "none",
                                        overflow: "hidden",
                                        lineHeight: "1.5rem",
                                    }}
                                />
                            ) : (
                                <div style={{ "minHeight": "1.5rem", "lineHeight": "1.5rem", "padding": "0", "margin": "0" }}>
                                    {line === '' ? '\u00A0' : renderScriptLine(line, i)}
                                </div>
                            )}
                        </div>
                    ))}
                    <div
                        style={{ "minHeight": "1.5rem", "lineHeight": "1.5rem", "cursor": "text", "padding": "0", "margin": "0", "backgroundColor": "transparent" }}
                        onClick={() => {
                            const newLines = [...lines, ''];
                            const updatedContent = newLines.join('\n');
                            handleScriptContentChange(updatedContent);
                            setTimeout(() => setActiveLine(lines.length), 0);
                        }}
                    >
                        <div style={{ "minHeight": "1.5rem", "lineHeight": "1.5rem", "padding": "0", "margin": "0", "color": "#6B7280" }}>
                            {'\u00A0'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}