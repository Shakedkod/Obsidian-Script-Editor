export interface StoryMetadata {
    title: string;
    writers: string[];
    prodCompany: string;
    date: string;
    characterFolder: string;
    locationFolder: string;
}

export const DEFAULT_STORY_METADATA: StoryMetadata = {
    title: "",
    writers: [],
    prodCompany: "",
    date: "",
    characterFolder: "",
    locationFolder: "",
};
