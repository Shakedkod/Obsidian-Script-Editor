import React from "react";
import { ScriptMetadata } from "../../models/ScriptMetadata";
import { i18n } from "../../i18n/i18n";

interface MetadataItemProps {
    field: keyof ScriptMetadata;
    data: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
}

function MetadataItem({
    field,
    data,
    onChange,
    label,
    placeholder,
}: MetadataItemProps): JSX.Element {
    return (
        <div className="se-field" key={field}>
            <label className="se-field-label">{label}:</label>
            <input
                className="se-field-input"
                type="text"
                value={data}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}

interface MetadataPageProps {
    metadata: ScriptMetadata;
    updateMetadata: (newMetadata: ScriptMetadata) => void;
}

export default function MetadataPage({
    metadata,
    updateMetadata,
}: MetadataPageProps): JSX.Element {
    return (
        <div className="se-page">
            <section className="se-meta-section">
                <MetadataItem
                    field="title"
                    data={metadata.title}
                    onChange={(value) => updateMetadata({ ...metadata, title: value })}
                    label={i18n.t("scriptEditor.title")}
                    placeholder="Enter script title"
                />
                <MetadataItem
                    field="subtitle"
                    data={metadata.subtitle || ""}
                    onChange={(value) => updateMetadata({ ...metadata, subtitle: value })}
                    label={i18n.t("scriptEditor.subtitle")}
                    placeholder="Enter script subtitle"
                />
                <MetadataItem
                    field="writers"
                    data={
                        Array.isArray(metadata.writers)
                            ? metadata.writers.join(", ")
                            : metadata.writers
                    }
                    onChange={(value) =>
                        updateMetadata({
                            ...metadata,
                            writers:
                                value.trim() === "inherit"
                                    ? "inherit"
                                    : value.split(",").map((s) => s.trim()),
                        })
                    }
                    label={i18n.t("scriptEditor.writers")}
                    placeholder="Enter writer(s) name"
                />
                <MetadataItem
                    field="prodCompany"
                    data={metadata.prodCompany}
                    onChange={(value) => updateMetadata({ ...metadata, prodCompany: value })}
                    label={i18n.t("scriptEditor.productionCompany")}
                    placeholder="Enter production company"
                />
                <MetadataItem
                    field="date"
                    data={metadata.date}
                    onChange={(value) => updateMetadata({ ...metadata, date: value })}
                    label={i18n.t("scriptEditor.date")}
                    placeholder="Enter date"
                />
            </section>

            <section className="se-meta-section">
                <MetadataItem
                    field="characterFolder"
                    data={metadata.characterFolder || ""}
                    onChange={(value) => updateMetadata({ ...metadata, characterFolder: value })}
                    label={i18n.t("scriptEditor.characterFolder")}
                    placeholder="Enter character notes folder"
                />
                <MetadataItem
                    field="locationFolder"
                    data={metadata.locationFolder || ""}
                    onChange={(value) => updateMetadata({ ...metadata, locationFolder: value })}
                    label={i18n.t("scriptEditor.locationFolder")}
                    placeholder="Enter location notes folder"
                />
            </section>
        </div>
    );
}
