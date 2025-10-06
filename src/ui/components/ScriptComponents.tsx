import React from "react";
import { App, Component, MarkdownRenderer } from "obsidian";
import { isRTL } from "../../i18n/i18n";
import { parseLine } from "../../services/scriptParsing";
import { isScene, ScriptElementType } from "../../models/ScriptModel";

export function SceneHeading({ children }: { children: string }): JSX.Element
{
    return (
        <div className="ScriptElements-SceneHeading">
            {children}
        </div>
    );
}

export function Action({ app, path, children }: { app: App; path: string; children: string }): JSX.Element
{
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (containerRef.current)
        {
            containerRef.current.innerHTML = "";
            MarkdownRenderer.render(app, children, containerRef.current, path, new Component());
        }
    }, [children]);

    return (
        <div className="ScriptElements-Action">
            <div ref={containerRef} />
        </div>
    );
}

export function Character({ openCharacterNote, children }: { openCharacterNote: (name: string) => void; children: string }): JSX.Element
{
    return (
        <div
            className="ScriptElements-Character"
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey) openCharacterNote(children);
            }}
        >
            <strong>{children}</strong>
        </div>
    );
}

export function Dialogue({ children }: { children: string }): JSX.Element
{
    let centered = false;

    if (children.startsWith("\""))
    {
        children = children.slice(1);
        centered = true;
    }

    return (
        <div
            style={{
                textAlign: centered ? "center" : "inherit",
                width: centered ? "100%" : "50%"
            }}
            className="ScriptElements-Dialogue"
        >
            {children}
        </div>
    );
}

export function Transition({ children }: { children: string }): JSX.Element
{
    return (
        <div className="ScriptElements-Transition">
            {children}
        </div>
    );
}

export function Subheader({ children }: { children: string }): JSX.Element
{
    const rtl = isRTL(children);

    return (
        <span className="ScriptElements-Subheader" style={{
            marginLeft: rtl ? "0" : "0.5em",
            marginRight: rtl ? "0.5em" : "0"
        }}>
            <strong>{children}</strong>
        </span>
    );
}

export default function scriptLineToReact(
    app: App,
    path: string,
    line: string,
    numberOfScenes = 1,
    setNumberOfScenes: (count: number) => void,
    openCharacterNote: (name: string) => void
): JSX.Element
{
    const parsedLine = parseLine(line);
    if (isScene(parsedLine)) 
    {
        const output = <SceneHeading>{`${numberOfScenes + 1}\t${parsedLine.heading}`}</SceneHeading>;
        setNumberOfScenes(numberOfScenes + 1);
        return output;
    }
    else
    {
        switch (parsedLine.type)
        {
            case ScriptElementType.Character:
                return <Character openCharacterNote={openCharacterNote}>{parsedLine.content}</Character>;
            case ScriptElementType.Dialogue:
                return <Dialogue>{parsedLine.content}</Dialogue>;
            case ScriptElementType.Transition:
                return <Transition>{parsedLine.content}</Transition>;
            case ScriptElementType.Subheader:
                return <Subheader>{parsedLine.content}</Subheader>;
            default:
                return <Action app={app} path={path}>{parsedLine.content}</Action>;
        }
    }
}