import React, { useEffect, useState, useRef, JSX } from "react";
import { TFile, App } from "obsidian";
import { scriptLineToReact, parseLine, ScriptMetadata, parseFrontmatter, serializeFrontmatter, isScene } from "src/scriptParser";
import { i18n, isRTL } from "src/i18n/i18n";

function getTextDirection(text: string): 'rtl' | 'ltr' {
    return isRTL(text) ? 'rtl' : 'ltr';
}

interface Props {
    file: TFile;
    app: App;
    setData: (data: string) => void;
    onSave?: () => void;
    AlefRegular: Uint8Array;
    AlefBold: Uint8Array;
    setModeCallback: (cb: (mode: "preview" | "source" | "metadata") => void) => void;
    openCharacterNote: (name: string) => void;
}

export function ScriptEditor({ file, app, setData, onSave, AlefRegular, AlefBold, setModeCallback, openCharacterNote }: Props): JSX.Element {
    const [fullText, setFullText] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({
        title: "",
        writers: "",
        prod_company: "",
        date: ""
    });
    const [scriptContent, setScriptContent] = useState("");
    const [mode, setMode] = useState<"preview" | "source" | "metadata">("preview");
    const [activeLine, setActiveLine] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Set initial mode and callback
    useEffect(() => {
        setModeCallback(setMode);
    }, [setModeCallback]);

    // Parse text into metadata and content whenever fullText changes
    useEffect(() => {
        const parsed = parseFrontmatter(fullText);
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

    return (
        <div style={{ "padding": "1rem", "width": "100%", "height": "100%", "fontFamily": "Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace" }}>
            {/* Title */}
            <div style={{ "display": "flex", "justifyContent": "space-between"}} dir={getTextDirection(metadata.title)}>
                <h2 style={{ "marginTop": "0", "marginBottom": "1rem", "fontSize": "1.5rem", "borderBottom": "1px solid #CCCCCCFF", "paddingBottom": "0.5rem" }}>
                    {metadata.title || "Untitled Script"} {metadata.subtitle && `- ${metadata.subtitle}`}
                </h2>
                {mode === "metadata" && (
                    <h2 style={{ "marginTop": "0", "marginBottom": "1rem", "fontSize": "1.5rem", "color": "#D1D5DB" }}>
                        {i18n.t("scriptEditor.properties")}
                    </h2>
                )}
            </div>

            {/* Actual Page */}
            {mode === "metadata" ? (
                <div style={{ "padding": "1rem", "backgroundColor": "#1F2937", "borderRadius": "0.5rem", "height": "80vh", "overflowY": "auto" }}>
                    <h3 style={{ "marginTop": "0", "marginBottom": "1.5rem", "color": "#ffffff", "fontSize": "1.25rem" }}>Script Metadata</h3>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Title:</label>
                        <input
                            type="text"
                            value={metadata.title}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "#374151", "color": "#ffffff", "border": "1px solid #4B5563", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter script title"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Subtitle:</label>
                        <input
                            type="text"
                            value={metadata.subtitle || ""}
                            onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "#374151", "color": "#ffffff", "border": "1px solid #4B5563", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter script subtitle (optional)"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Writers:</label>
                        <input
                            type="text"
                            value={metadata.writers}
                            onChange={(e) => handleMetadataChange('writers', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "#374151", "color": "#ffffff", "border": "1px solid #4B5563", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter author name"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Production Company:</label>
                        <input
                            type="text"
                            value={metadata.prod_company}
                            onChange={(e) => handleMetadataChange('prod_company', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "backgroundColor": "#374151", "color": "#ffffff", "border": "1px solid #4B5563", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter production company"
                        />
                    </div>

                    <div style={{ "marginBottom": "1rem" }}>
                        <label style={{ "display": "block", "marginBottom": "0.5rem", "color": "#D1D5DB", "fontWeight": "bold" }}>Date:</label>
                        <input
                            type="date"
                            value={metadata.date}
                            onChange={(e) => handleMetadataChange('date', e.target.value)}
                            style={{ "width": "100%", "padding": "0.5rem", "paddingLeft": "1.5rem", "backgroundColor": "#374151", "color": "#ffffff", "border": "1px solid #4B5563", "borderRadius": "0.25rem", "fontFamily": "inherit" }}
                            placeholder="Enter date (e.g., 2024-01-15)"
                        />
                    </div>

                    <div style={{ "marginTop": "2rem", "padding": "1rem", "backgroundColor": "#374151", "borderRadius": "0.25rem" }}>
                        <h4 style={{ "marginTop": "0", "marginBottom": "0.5rem", "color": "#D1D5DB" }}>Preview:</h4>
                        <pre style={{ "margin": "0", "color": "#9CA3AF", "fontSize": "0.875rem", "whiteSpace": "pre-wrap" }}>
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
                                    onChange={(e) => handleLineChange(i, e.target.value)}
                                    onBlur={() => setActiveLine(null)}
                                    dir={getTextDirection(line)}
                                    onKeyDown={(e) => {
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