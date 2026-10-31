export interface ScriptMetadata {
    title: string;
    subtitle?: string;
    writers: string[] | "inherit";
    prodCompany: string | "inherit";
    date: string | "inherit";
    characterFolder?: string | "inherit";
    locationFolder?: string | "inherit";
}

export const DEFAULT_METADATA: ScriptMetadata = {
    title: "",
    subtitle: "",
    writers: "inherit",
    prodCompany: "inherit",
    date: "inherit",
    characterFolder: "inherit",
    locationFolder: "inherit",
};
