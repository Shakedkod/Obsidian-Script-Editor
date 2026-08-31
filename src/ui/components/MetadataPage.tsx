import React from "react";
import { ScriptMetadata } from "src/models/ScriptMetadata";

interface MetadataItemProps
{
    field: string;
    inherited?: boolean;
    data: string;
    handleMetadataChange: (key: string, value: string) => void;
    label: string;
    placeholder: string;
}

function MetadataItem({ field, inherited, data, handleMetadataChange, label, placeholder }: MetadataItemProps): JSX.Element
{
    //if (!inherited)
        return (
            <div className="se-field" key={field}>
                <label className="se-field-label">{label}:</label>
                <input
                    className="se-field-input"
                    type="text"
                    value={data}
                    onChange={(e) => handleMetadataChange(field, e.target.value)}
                    placeholder={placeholder}
                />
            </div>
        );

    //return (
    //    <div className="se-field" key={field}>
    //        <label className="se-field-label">{label}:</label>
    //        <input
    //            className="se-field-input-disabled"
    //            type="text"
    //            value={data}
    //            onChange={(e) => handleMetadataChange(field, e.target.value)}
    //            placeholder={placeholder}
    //            disabled
    //        />
    //    </div>
    //);
}

interface MetadataPageProps
{
    metadata: ScriptMetadata;
    updateMetadata: (newMetadata: ScriptMetadata) => void;
}

export default function MetadataPage({ metadata, updateMetadata }: MetadataPageProps): JSX.Element
{
    return (
        <div className="se-page">
            {/* Actual Script Items */}
            <section className="se-meta-section">
                <MetadataItem
                    field="title"
                    inherited={false}
                    data={metadata.title}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Title"
                    placeholder="Enter script title"
                />
                <MetadataItem
                    field="subtitle"
                    inherited={false}
                    data={metadata.subtitle || ""}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Subtitle"
                    placeholder="Enter script subtitle"
                />
                <MetadataItem
                    field="writers"
                    inherited={metadata.writers === "inherit"}
                    data={Array.isArray(metadata.writers) ? metadata.writers.join(", ") : metadata.writers}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value.split(",").map(s => s.trim()) })}
                    label="Writers"
                    placeholder="Enter writer(s) name"
                />
                <MetadataItem
                    field="prod_company"
                    inherited={metadata.prodCompany === "inherit"}
                    data={metadata.prodCompany}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Production Company"
                    placeholder="Enter production company"
                />
                <MetadataItem
                    field="date"
                    inherited={metadata.date === "inherit"}
                    data={metadata.date}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Date"
                    placeholder="Enter date"
                />
            </section>

            {/* Plugin Metadata Items */}
            <section className="se-meta-section">
                <MetadataItem
                    field="characterFolder"
                    inherited={metadata.characterFolder === "inherit"}
                    data={metadata.characterFolder || ""}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Character Folder"
                    placeholder="Enter character notes folder"
                />
                <MetadataItem
                    field="locationFolder"
                    inherited={metadata.locationFolder === "inherit"}
                    data={metadata.locationFolder || ""}
                    handleMetadataChange={(field, value) => updateMetadata({ ...metadata, [field]: value })}
                    label="Location Folder"
                    placeholder="Enter location notes folder"
                />
            </section>
        </div>
    );
}