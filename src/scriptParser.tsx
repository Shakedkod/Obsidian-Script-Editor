import React from "react";
import { Action, Character, Dialogue, SceneHeading, Subheader, Transition } from "./components/ScriptParts";

export type ScriptMetadata = {
    title: string;
    author: string;
    prod_company: string;
    date: string;
};

export enum ScriptElementType 
{
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Transition,
    Subheader
}

export type Scene = {
    id: number;
    heading: string;
    elements: ({ type: ScriptElementType; content: string })[];
};

export type Script = ScriptMetadata & {
    scenes: Scene[];
};

export function parseLine(line: string): { type: ScriptElementType; content: string } | Scene
{
    if (line.startsWith("##"))
        return { type: ScriptElementType.Subheader, content: line.slice(2).trim() };
    if (line.startsWith("#"))
        return { id: 0, heading: line.slice(1).trim(), elements: [] };
    if (line.startsWith("@"))
        return { type: ScriptElementType.Character, content: line.slice(1).trim() };
    if (line.startsWith("\""))
        return { type: ScriptElementType.Dialogue, content: line.slice(1).trim() };
    if (line.startsWith("-"))
        return { type: ScriptElementType.Transition, content: line.slice(1).trim() };
    return { type: ScriptElementType.Action, content: line.trim() };
}

function isScene(obj: any): obj is Scene {
    return obj && typeof obj === "object" && "id" in obj && "heading" in obj && "elements" in obj;
}

export default function parseFull(metadata: ScriptMetadata, content: string): Script
{
    var result: Script = {
        title: metadata.title,
        author: metadata.author,
        prod_company: metadata.prod_company,
        date: metadata.date,
        scenes: []
    };

    var sceneId = 1;
    var currentScene: Scene | null = null;
    var lines = content.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    for (var line of lines)
    {
        var current = parseLine(line);
        if (isScene(current))
        {
            if (currentScene) 
            {
                currentScene.id = sceneId;
                result.scenes.push(currentScene);
                sceneId++;
            }
            currentScene = current;
        }
        else if (currentScene) 
        {
            if (!currentScene.elements) 
            {
                currentScene.elements = [];
            }
            currentScene.elements.push(current);
        }
        else
        {
            currentScene = {id: 0, heading: "", elements: []};
            currentScene.elements.push(current);
        }
    }

    return result;
}

export function scriptToReact(script: Script)
{
    return (
        <>
            {script.scenes.map((scene, index) => {
                const totalDigits = script.scenes.length.toString().length;

                return (
                    <div key={index}>
                        <SceneHeading>{`${scene.id.toString().padStart(totalDigits, "0")}\t${scene.heading}`}</SceneHeading>
                        {scene.elements.map((element, elemIndex) => {
                            switch (element.type) {
                                case ScriptElementType.Character:
                                    return <Character>{element.content}</Character>;
                                case ScriptElementType.Dialogue:
                                    return <Dialogue>{element.content}</Dialogue>;
                                case ScriptElementType.Transition:
                                    return <Transition>{element.content}</Transition>;
                                case ScriptElementType.Subheader:
                                    return <Subheader>{element.content}</Subheader>;
                                default:
                                    return <Action>{element.content}</Action>;
                            }
                        })}
                    </div>
                );
            })}
        </>
    )
}

export function scriptStringToReact(script: string, metadata: ScriptMetadata)
{
    const parsedScript = parseFull(metadata, script);
    return scriptToReact(parsedScript);
}

export function scriptLineToReact(line: string, numberOfScenes: number = 1, setNumberOfScenes: (count: number) => void)
{
    const parsedLine = parseLine(line);
    if (isScene(parsedLine)) 
    {
        var output = <SceneHeading>{`${numberOfScenes + 1}\t${parsedLine.heading}`}</SceneHeading>;
        setNumberOfScenes(numberOfScenes + 1);
        return output;
    }
    else 
    {
        switch (parsedLine.type) 
        {
            case ScriptElementType.Character:
                return <Character>{parsedLine.content}</Character>;
            case ScriptElementType.Dialogue:
                return <Dialogue>{parsedLine.content}</Dialogue>;
            case ScriptElementType.Transition:
                return <Transition>{parsedLine.content}</Transition>;
            case ScriptElementType.Subheader:
                return <Subheader>{parsedLine.content}</Subheader>;
            default:
                return <Action>{parsedLine.content}</Action>;
        }
    }
}