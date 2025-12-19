import React, { useState } from "react";
import { isScene, ScriptMetadata } from "../../models/ScriptModel";
import { getTextAlign, getTextDirection } from "../../i18n/i18n";
import { getCharacterList, parseLine } from "../../services/scriptParsing";
import scriptLineToReact from "./ScriptComponents";
import { App, TFolder } from "obsidian";

function resizeTextarea (el: HTMLTextAreaElement | null)
{
    if (el) {
        el.style.height = "auto";
        el.style.height = `${el.scrollHeight}px`;
    }
}

function getSceneNumbers(lines: string[])
{
    const sceneNumbers: { [lineIndex: number]: number } = {};
    let currentSceneNumber = 0;

    lines.forEach((line, index) => {
        const parsed = parseLine(line);
        if (isScene(parsed))
        {
            currentSceneNumber++;
            sceneNumbers[index] = currentSceneNumber;
        }
    });

    return sceneNumbers;
}

function renderScriptLine(app: App, filePath: string, lines: string[], line: string, lineIndex: number, openCharacterNote: (name: string) => void)
{
    const parsed = parseLine(line);
    if (isScene(parsed))
    {
        const scenes = getSceneNumbers(lines);
        const sceneNumber = scenes[lineIndex] || 1;
        const totalScenes = Math.max(...Object.values(scenes), 1);
        const totalDigits = totalScenes.toString().length;

        return (
            <div className="SE-VP-sceneHeading-container">
                {`${sceneNumber.toString().padStart(totalDigits, "0")}\t${parsed.heading}`}
            </div>
        );
    }
    else
        return scriptLineToReact(app, filePath, line, 0, () => {return;}, openCharacterNote);
}

interface Props
{
    app: App;
    filePath: string;
    lines: string[];
    setScriptContent: (content: string) => void;
    updateFullText: (newContent: string) => void;
    setCharacterSuggestionsOpen: (value: boolean) => void;
    setSuggestionAnchor: ({ top, left }: {top: number; left: number;}) => void;
    characterSuggestionOpen: boolean;
    characters: string[];
    characterQuery: string;
    setCharacterQuery: (q: string) => void;
    openCharacterNote: (name: string) => void;
    metadata: ScriptMetadata;
    characterFolder: string;
}

export default function ViewPage(
    {
        app,
        filePath,
        lines,
        setScriptContent,
        updateFullText,
        setCharacterSuggestionsOpen,
        setSuggestionAnchor,
        characterSuggestionOpen,
        characters,
        characterQuery,
        setCharacterQuery,
        openCharacterNote,
        metadata,
        characterFolder
}: Props): JSX.Element
{
    const [activeLine, setActiveLine] = useState<number | null>();
    const [characterSuggestionSelectedIndex, setCharacterSuggestionSelectedIndex] = useState(0);

    function handleScriptContentChange(newContent: string)
    {
        setScriptContent(newContent);
        updateFullText(newContent);
    }

    function handleLineChange(i: number, newText: string)
    {
        const newLines = [...lines];
        newLines[i] = newText;
        const updatedContent = newLines.join("\n");
        handleScriptContentChange(updatedContent);
    }

    async function insertCharacterAtCursor(name: string): Promise<void>
    {
        const newLine = lines[activeLine].replace(/@ ([\p{L}\p{N}_]*)$/u, `@ ${name}`);
        handleLineChange(activeLine, newLine);

        setCharacterSuggestionsOpen(false);
        setCharacterQuery("");
        setCharacterSuggestionSelectedIndex(0);

        const renderedName = name.normalize("NFC");
        const exists = getCharacterList(app, metadata, characterFolder).some(
            c => c.normalize("NFC").toLowerCase() === renderedName.toLowerCase()
        );

        if (!exists)
        {
            const folderPath = metadata.characterFolder || characterFolder;
            const folder = app.vault.getAbstractFileByPath(folderPath);

            if (folder instanceof TFolder)
            {
                const filePath = `${folderPath}/${renderedName}.md`;
                if (!app.vault.getAbstractFileByPath(filePath))
                    await app.vault.create(filePath, "");
            }
        }
    }

    function handleChangedTextArea(i: number, e: React.ChangeEvent<HTMLTextAreaElement>): void
    {
        const value = e.target.value;
        handleLineChange(i, value);

        const cursorIndex = e.target.selectionStart ?? 0;
        const textBeforeCursor = value.slice(0, cursorIndex);
        const isCharacter = textBeforeCursor.match(/@ ([\p{L}\p{N}_]*)$/u); // match "@ character_name"

        if (isCharacter)
        {
            const query = isCharacter[1];
            setCharacterQuery(query);
            setCharacterSuggestionsOpen(true);

            const rect = e.target.getBoundingClientRect();
            setSuggestionAnchor({ top: rect.bottom, left: rect.left + cursorIndex * 8 });
        }
        else
            setCharacterSuggestionsOpen(false);
    }

    function handleKeyPress(
        lines: string[],
        line: string,
        i: number,
        e: React.KeyboardEvent<HTMLTextAreaElement>,
        characterSuggestionOpen: boolean
    ) {
        if (characterSuggestionOpen)
            switch (e.key)
            {
                case "ArrowDown":
                {
                    e.preventDefault();
                    setCharacterSuggestionSelectedIndex(
                        (prev) => (prev + 1) % characters.length
                    );
                    return;
                }
                case "ArrowUp":
                {
                    e.preventDefault();
                    setCharacterSuggestionSelectedIndex((prev) =>
                        (prev - 1 + characters.length) % characters.length
                    );
                    return;
                }
                case "Tab":
                case "Enter":
                {
                    e.preventDefault();
                    const selected = characters[characterSuggestionSelectedIndex] || characterQuery;
                    insertCharacterAtCursor(selected);
                    return;
                }
                case "Escape":
                {
                    e.preventDefault();
                    setCharacterSuggestionsOpen(false);
                    return;
                }
            }
        else
            switch (e.key)
            {
                case "Enter":
                {
                    e.preventDefault();

                    const newLines = [...lines];
                    newLines.splice(i + 1, 0, '');
                    const updatedContent = newLines.join('\n');

                    handleScriptContentChange(updatedContent);
                    setTimeout(() => setActiveLine(i + 1), 0);
                    break;
                }
                case "Escape":
                {
                    setActiveLine(null);
                    break;
                }
                case "ArrowUp":
                {
                    e.preventDefault();
                    if (i > 0) setActiveLine(i - 1);
                    break;
                }
                case "ArrowDown":
                {
                    e.preventDefault();
                    if (i < lines.length - 1) setActiveLine(i + 1);
                    break;
                }
                case "Backspace":
                {
                    if (line === "" && lines.length > 1)
                    {
                        e.preventDefault();

                        const newLines = [...lines];
                        newLines.splice(i, 1);
                        const updatedContent = newLines.join('\n');

                        handleScriptContentChange(updatedContent);
                        if (i > 0) setTimeout(() => setActiveLine(i - 1), 0);
                        else setActiveLine(null);
                    }
                    break;
                }
            }
    }

    return (
        <div className="SE-page-container">
            {lines.map((line, i) => (
                <div
                    key={i}
                    onClick={() => setActiveLine(i)}
                    className="SE-VP-line-container"
                >
                    {activeLine === i ? (
                        <textarea
                            ref={resizeTextarea}
                            onInput={(e) => resizeTextarea(e.target as HTMLTextAreaElement)}
                            value={line}
                            onChange={(e) => handleChangedTextArea(i, e)}
                            onBlur={() => setActiveLine(null)}
                            dir={getTextDirection(line)}
                            onKeyDown={
                                (e) => handleKeyPress(
                                    lines,
                                    line,
                                    i,
                                    e,
                                    characterSuggestionOpen
                                )
                            }
                            autoFocus
                            rows={1}
                            className="SE-VP-line-active"
                        />
                    ) : (
                        <div className="SE-VP-line" style={{
                            direction: getTextDirection(line),
                            textAlign: getTextAlign(line)
                        }}>
                            {line === "" ? "\u00A0" : renderScriptLine(app, filePath, lines, line, i, openCharacterNote)}
                        </div>
                    )}
                </div>
            ))}

            <div
                className="SE-VP-line-container"
                onClick={() => {
                    const newLines = [...lines, ""];
                    const updatedContent = newLines.join("\n");

                    handleScriptContentChange(updatedContent);
                    setTimeout(() => setActiveLine(lines.length), 0);
                }}
            >
                <div className="SE-VP-bottom" style={{backgroundColor: "transparent"}}>
                    {"\u00A0"}
                </div>
            </div>
        </div>
    );
}