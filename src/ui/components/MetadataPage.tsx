import React from "react";
import { ScriptMetadata } from "src/models/ScriptModel";

interface MetadataItemProps
{
    field: string;
    data: string;
    handleMetadataChange: (key: string, value: string) => void;
    label: string;
    placeholder: string;
}

function MetadataItem({ field, data, handleMetadataChange, label, placeholder }: MetadataItemProps): JSX.Element
{
    return (
        <div className="SE-MP-ITEM-container" key={field}>
            <label className="SE-MP-ITEM-label">{label}:</label>
            <input
                className="SE-MP-ITEM-input"
                type="text"
                value={data}
                onChange={(e) => handleMetadataChange(field, e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

interface MetadataPageProps
{
    metadata: ScriptMetadata;
    updateMetadata: (newMetadata: ScriptMetadata) => void;
}

export default function MetadataPage({ metadata, updateMetadata }: MetadataPageProps): JSX.Element
{
    return (
        <div className="SE-page-container">
            <MetadataItem
                field="title"
                data={metadata.title}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Title"
                placeholder="Enter script title"
            />
            <MetadataItem
                field="subtitle"
                data={metadata.subtitle || ""}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Subtitle"
                placeholder="Enter script subtitle"
            />
            <MetadataItem
                field="writers"
                data={metadata.writers}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Writers"
                placeholder="Enter writer(s) name"
            />
            <MetadataItem
                field="prod_company"
                data={metadata.prod_company}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Production Company"
                placeholder="Enter production company"
            />
            <MetadataItem
                field="date"
                data={metadata.date}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Date"
                placeholder="Enter date"
            />
            <MetadataItem
                field="characterFolder"
                data={metadata.characterFolder || ""}
                handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                label="Character Folder"
                placeholder="Enter character notes folder"
            />
        </div>
    );
}