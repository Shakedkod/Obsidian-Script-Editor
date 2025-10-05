export type ScriptMetadata = {
    title: string;
    subtitle?: string; // Optional subtitle
    writers: string;
    prod_company: string;
    date: string;
    characterFolder?: string; // Optional folder for character notes
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

export type ScriptElement = {
    type: ScriptElementType;
    content: string;
};

export type Scene = {
    id: number;
    heading: string;
    elements: ScriptElement[];
};

export type Script = ScriptMetadata & {
    scenes: Scene[];
};

export function isScene(obj: unknown): obj is Scene
{
    return obj && (typeof obj === "object") && ("id" in obj) && ("heading" in obj) && ("elements" in obj);
}