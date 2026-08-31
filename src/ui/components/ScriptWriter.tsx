import * as React from "react";
import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { sceneNumberField, scriptLivePreview } from "./ViewMode";

interface Props {
    value: string;
    onChange: (value: string) => void;
    livePreview: boolean;
}

export default function ScriptViewWriter({ value, onChange, livePreview }: Props): JSX.Element
{
    const hostRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const previewCompartment = useRef(new Compartment()).current;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const lastEmitted = useRef(value);

    useEffect(() => {
        if (!hostRef.current) return;

        const view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: [
                    history(),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    EditorView.lineWrapping,
                    sceneNumberField,
                    previewCompartment.of(livePreview ? [scriptLivePreview] : []),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            const text = update.state.doc.toString();
                            lastEmitted.current = text;
                            onChangeRef.current(text);
                        }
                    }),
                ],
            }),
            parent: hostRef.current,
        });

        viewRef.current = view;
        return () => view.destroy();
    }, []);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        if (value === lastEmitted.current) return;

        const currentDoc = view.state.doc.toString();
        if (currentDoc === value) return;

        view.dispatch({
            changes: { from: 0, to: currentDoc.length, insert: value },
        });
        lastEmitted.current = value;
    }, [value]);

    useEffect(() => {
        viewRef.current?.dispatch({
            effects: previewCompartment.reconfigure(livePreview ? [scriptLivePreview] : []),
        });
    }, [livePreview]);

    return <div className="SE-editable-area" ref={hostRef} />;
}