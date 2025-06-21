import React, { useEffect, useState, useRef, JSX } from "react";
import { TFile, App } from "obsidian";
import { scriptLineToReact, parseLine, ScriptMetadata } from "src/scriptParser";

function isScene(obj: any): obj is { id: number; heading: string; elements: any[] } {
    return obj && typeof obj === "object" && "id" in obj && "heading" in obj && "elements" in obj;
}

function isRTL(text: string): boolean {
    const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlRegex.test(text);
}

function getTextDirection(text: string): 'rtl' | 'ltr' {
    return isRTL(text) ? 'rtl' : 'ltr';
}

function parseFrontmatter(content: string): { metadata: ScriptMetadata; contentWithoutFrontmatter: string } {
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    
    if (frontmatterMatch) {
        const frontmatterContent = frontmatterMatch[1];
        const scriptContent = frontmatterMatch[2] || '';
        
        const metadata: ScriptMetadata = {
            title: "",
            subtitle: "", // Optional subtitle
            author: "",
            prod_company: "",
            date: ""
        };
        
        const lines = frontmatterContent.split(/\r?\n/);
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                // Remove surrounding quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                switch (key.toLowerCase()) {
                    case 'title':
                        metadata.title = value;
                        break;
                    case 'subtitle':
                        metadata.subtitle = value; // Optional subtitle
                        break;
                    case 'author':
                        metadata.author = value;
                        break;
                    case 'prod_company':
                        metadata.prod_company = value;
                        break;
                    case 'date':
                        metadata.date = value;
                        break;
                }
            }
        }
        
        return { metadata, contentWithoutFrontmatter: scriptContent };
    } else {
        // No frontmatter found, return empty metadata and full content
        return {
            metadata: {
                title: "",
                author: "",
                prod_company: "",
                date: ""
            },
            contentWithoutFrontmatter: content
        };
    }
}

// Helper function to serialize metadata to frontmatter
function serializeFrontmatter(metadata: ScriptMetadata): string {
    const lines = [];
    
    // Helper function to properly quote values that need it
    const formatValue = (value: string): string => {
        if (!value) return '';
        // Quote if contains special characters, starts/ends with spaces, or contains colons
        if (value.includes(':') || value.includes('#') || value.includes('[') || value.includes(']') || 
            value.includes('{') || value.includes('}') || value.includes('|') || value.includes('>') ||
            value.startsWith(' ') || value.endsWith(' ') || value.includes('\n')) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
    };
    
    if (metadata.title) lines.push(`title: ${formatValue(metadata.title)}`);
    if (metadata.subtitle) lines.push(`subtitle: ${formatValue(metadata.subtitle)}`); // Optional subtitle
    if (metadata.author) lines.push(`author: ${formatValue(metadata.author)}`);
    if (metadata.prod_company) lines.push(`prod_company: ${formatValue(metadata.prod_company)}`);
    if (metadata.date) lines.push(`date: ${formatValue(metadata.date)}`);
    
    if (lines.length === 0) {
        return '';
    }
    
    return `---\n${lines.join('\n')}\n---\n`;
}

interface Props
{
    file: TFile;
    app: App;
    setData: (data: string) => void;
    onSave?: () => void;
    AlefRegular: Uint8Array;
    AlefBold: Uint8Array;
    setModeCallback: (cb: (mode: "preview" | "source" | "metadata") => void) => void;
}

export function ScriptEditor({ file, app, setData, onSave, AlefRegular, AlefBold, setModeCallback }: Props): JSX.Element {
    const [fullText, setFullText] = useState("");
    const [metadata, setMetadata] = useState<ScriptMetadata>({
        title: "",
        author: "",
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

    const saveFile = async () => {
        if (isSaving) return;
        
        try {
            setIsSaving(true);
            await app.vault.modify(file, fullText);
            setData(fullText);
            onSave?.();
            console.log("💾 Saved");
        } catch (error) {
            console.error("Failed to save file:", error);
        } finally {
            setIsSaving(false);
        }
    };

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
            return scriptLineToReact(line, 0, () => {});
        }
    };

    const handleLineChange = (i: number, newText: string) => {
        const newLines = [...lines];
        newLines[i] = newText;
        const updatedContent = newLines.join("\n");
        handleScriptContentChange(updatedContent);
    };

    return (
        <div style={{"padding":"1rem","width":"100%","height":"100%","fontFamily":"Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace"}}>
            <div style={{"display":"flex","marginBottom":"1rem","justifyContent":"space-between","flexWrap":"wrap","gap":"0.5rem"}}>
                <div style={{"display":"flex","gap":"0.5rem","flexWrap":"wrap"}}>
                    <button
                        style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","borderRadius":"0.25rem","backgroundColor": mode === "preview" ? "#2563EB" : "#374151","color":"#ffffff","border":"none","cursor":"pointer"}}
                        onClick={() => setMode("preview")}
                    >
                        Preview
                    </button>
                    <button
                        style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","borderRadius":"0.25rem","backgroundColor": mode === "source" ? "#2563EB" : "#374151","color":"#ffffff","border":"none","cursor":"pointer"}}
                        onClick={() => setMode("source")}
                    >
                        Source
                    </button>
                    <button
                        style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","borderRadius":"0.25rem","backgroundColor": mode === "metadata" ? "#2563EB" : "#374151","color":"#ffffff","border":"none","cursor":"pointer"}}
                        onClick={() => setMode("metadata")}
                    >
                        Metadata
                    </button>
                    <button
                        style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","borderRadius":"0.25rem","backgroundColor": isSaving ? "#1D4ED8" : "#10B981","color":"#ffffff","border":"none","cursor": isSaving ? "not-allowed" : "pointer"}}
                        onClick={saveFile}
                        disabled={isSaving}
                    >
                        {isSaving ? "Saving..." : "Save (Ctrl+S)"}
                    </button>
                    <button
                        style={{"paddingTop":"0.25rem","paddingBottom":"0.25rem","paddingLeft":"0.75rem","paddingRight":"0.75rem","borderRadius":"0.25rem","backgroundColor":"#F59E0B","color":"#ffffff","border":"none","cursor":"pointer"}}
                        onClick={() => {
                            // Export to PDF functionality
                            //
                            //
                            //
                            //
                            //
                            throw Error("Export to PDF functionality not implemented yet.");
                        }}
                    >
                        Export to PDF
                    </button>
                </div>
                <span style={{"fontSize":"0.875rem","lineHeight":"1.25rem","color":"#9CA3AF"}}>{metadata.title}</span>
            </div>

            {mode === "metadata" ? (
                <div style={{"padding":"1rem","backgroundColor":"#1F2937","borderRadius":"0.5rem","height":"80vh","overflowY":"auto"}}>
                    <h3 style={{"marginTop":"0","marginBottom":"1.5rem","color":"#ffffff","fontSize":"1.25rem"}}>Script Metadata</h3>
                    
                    <div style={{"marginBottom":"1rem"}}>
                        <label style={{"display":"block","marginBottom":"0.5rem","color":"#D1D5DB","fontWeight":"bold"}}>Title:</label>
                        <input
                            type="text"
                            value={metadata.title}
                            onChange={(e) => handleMetadataChange('title', e.target.value)}
                            style={{"width":"100%","padding":"0.5rem","backgroundColor":"#374151","color":"#ffffff","border":"1px solid #4B5563","borderRadius":"0.25rem","fontFamily":"inherit"}}
                            placeholder="Enter script title"
                        />
                    </div>

                    <div style={{"marginBottom":"1rem"}}>
                        <label style={{"display":"block","marginBottom":"0.5rem","color":"#D1D5DB","fontWeight":"bold"}}>Subtitle:</label>
                        <input
                            type="text"
                            value={metadata.subtitle || ""}
                            onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                            style={{"width":"100%","padding":"0.5rem","backgroundColor":"#374151","color":"#ffffff","border":"1px solid #4B5563","borderRadius":"0.25rem","fontFamily":"inherit"}}
                            placeholder="Enter script subtitle (optional)"
                        />
                    </div>
                    
                    <div style={{"marginBottom":"1rem"}}>
                        <label style={{"display":"block","marginBottom":"0.5rem","color":"#D1D5DB","fontWeight":"bold"}}>Author:</label>
                        <input
                            type="text"
                            value={metadata.author}
                            onChange={(e) => handleMetadataChange('author', e.target.value)}
                            style={{"width":"100%","padding":"0.5rem","backgroundColor":"#374151","color":"#ffffff","border":"1px solid #4B5563","borderRadius":"0.25rem","fontFamily":"inherit"}}
                            placeholder="Enter author name"
                        />
                    </div>
                    
                    <div style={{"marginBottom":"1rem"}}>
                        <label style={{"display":"block","marginBottom":"0.5rem","color":"#D1D5DB","fontWeight":"bold"}}>Production Company:</label>
                        <input
                            type="text"
                            value={metadata.prod_company}
                            onChange={(e) => handleMetadataChange('prod_company', e.target.value)}
                            style={{"width":"100%","padding":"0.5rem","backgroundColor":"#374151","color":"#ffffff","border":"1px solid #4B5563","borderRadius":"0.25rem","fontFamily":"inherit"}}
                            placeholder="Enter production company"
                        />
                    </div>
                    
                    <div style={{"marginBottom":"1rem"}}>
                        <label style={{"display":"block","marginBottom":"0.5rem","color":"#D1D5DB","fontWeight":"bold"}}>Date:</label>
                        <input
                            type="text"
                            value={metadata.date}
                            onChange={(e) => handleMetadataChange('date', e.target.value)}
                            style={{"width":"100%","padding":"0.5rem","backgroundColor":"#374151","color":"#ffffff","border":"1px solid #4B5563","borderRadius":"0.25rem","fontFamily":"inherit"}}
                            placeholder="Enter date (e.g., 2024-01-15)"
                        />
                    </div>
                    
                    <div style={{"marginTop":"2rem","padding":"1rem","backgroundColor":"#374151","borderRadius":"0.25rem"}}>
                        <h4 style={{"marginTop":"0","marginBottom":"0.5rem","color":"#D1D5DB"}}>Preview:</h4>
                        <pre style={{"margin":"0","color":"#9CA3AF","fontSize":"0.875rem","whiteSpace":"pre-wrap"}}>
                            {serializeFrontmatter(metadata) || "No metadata to display"}
                        </pre>
                    </div>
                </div>
            ) : mode === "source" ? (
                <textarea
                    style={{"padding":"1rem","width":"100%","resize":"none","height":"80vh","fontFamily":"inherit",fontSize:"1em",backgroundColor:"transparent",border:"none"}}
                    value={fullText}
                    onChange={(e) => setFullText(e.target.value)}
                    spellCheck={false}
                    placeholder="Enter your script content here..."
                />
            ) : (
                <div ref={containerRef} style={{"display":"flex","flexDirection":"column","minHeight":"80vh","padding":"1rem","backgroundColor":"transparent"}}>
                    {lines.map((line, i) => (
                        <div
                            key={i}
                            style={{"minHeight":"1.5rem","lineHeight":"1.5rem","cursor":"text","padding":"0","margin":"0","backgroundColor":"transparent"}}
                            onClick={() => setActiveLine(i)}
                        >
                            {activeLine === i ? (
                                <input
                                    style={{"width":"100%","height":"1.5rem","lineHeight":"1.5rem","backgroundColor":"transparent","border":"none","outline":"none","fontFamily":"inherit","fontSize":"inherit","padding":"0","margin":"0"}}
                                    value={line}
                                    onChange={(e) => handleLineChange(i, e.target.value)}
                                    onBlur={() => setActiveLine(null)}
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
                                />
                            ) : (
                                <div style={{"minHeight":"1.5rem","lineHeight":"1.5rem","padding":"0","margin":"0"}}>
                                    {line === '' ? '\u00A0' : renderScriptLine(line, i)}
                                </div>
                            )}
                        </div>
                    ))}
                    <div
                        style={{"minHeight":"1.5rem","lineHeight":"1.5rem","cursor":"text","padding":"0","margin":"0","backgroundColor":"transparent"}}
                        onClick={() => {
                            const newLines = [...lines, ''];
                            const updatedContent = newLines.join('\n');
                            handleScriptContentChange(updatedContent);
                            setTimeout(() => setActiveLine(lines.length), 0);
                        }}
                    >
                        <div style={{"minHeight":"1.5rem","lineHeight":"1.5rem","padding":"0","margin":"0","color":"#6B7280"}}>
                            {'\u00A0'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}