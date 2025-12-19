export interface ScriptMetadata 
{
    title: string;
    subtitle?: string;
    writers: string[] | "inherit";
    prodCompany: string | "inherit";
    date: string | "inherit";
    characterFolder?: string | "inherit";
    locationFolder?: string | "inherit";
}