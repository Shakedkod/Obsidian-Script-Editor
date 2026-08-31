import { ScriptMetadata } from "./ScriptMetadata";

export enum ScriptElementType
{
    SceneHeading,
    Action,
    Character,
    Dialogue,
    Transition,
    Subheader
}

export type ScriptElement = {
    type: ScriptElementType;
    content: string;
};

export type Scene = {
    id: number;
    heading: string;
    elements: ScriptElement[];
};

export interface Script 
{
    metadata: ScriptMetadata;
    scenes: Scene[];
};

export function isScene(obj: unknown): obj is Scene
{
    return typeof obj === "object" && obj !== null && ("id" in obj) && ("heading" in obj) && ("elements" in obj);
}