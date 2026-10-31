import * as React from "react";
import { useEffect, useRef } from "react";
import { EditorState, Compartment, EditorSelection } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { sceneNumberField, scriptLivePreview } from "./ViewMode";
import { scriptAutocomplete } from "./ScriptAutocomplete";

interface Props {
    value: string;
    onChange: (value: string) => void;
    livePreview: boolean;
}

export default function ScriptViewWriter({ value, onChange, livePreview }: Props): JSX.Element {
    const hostRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const previewCompartment = useRef(new Compartment()).current;
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const lastEmitted = useRef(value);
    const applyingExternal = useRef(false);

    useEffect(() => {
        if (!hostRef.current) return;

        const view = new EditorView({
            state: EditorState.create({
                doc: value,
                extensions: [
                    history(),
                    closeBrackets(),
                    scriptAutocomplete(),
                    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
                    EditorView.lineWrapping,
                    sceneNumberField,
                    previewCompartment.of(livePreview ? [scriptLivePreview] : []),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && !applyingExternal.current) {
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
        return () => {
            view.destroy();
            viewRef.current = null;
        };
    }, []);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const nextValue = value ?? "";
        if (nextValue === lastEmitted.current) return;

        const docLen = view.state.doc.length;
        const currentDoc = view.state.doc.toString();
        if (currentDoc === nextValue) {
            lastEmitted.current = nextValue;
            return;
        }

        const nextHead = Math.min(view.state.selection.main.head, nextValue.length);

        applyingExternal.current = true;
        try {
            view.dispatch({
                changes: { from: 0, to: docLen, insert: nextValue },
                selection: EditorSelection.cursor(nextHead),
            });
            lastEmitted.current = nextValue;
        } finally {
            applyingExternal.current = false;
        }
    }, [value]);

    useEffect(() => {
        viewRef.current?.dispatch({
            effects: previewCompartment.reconfigure(livePreview ? [scriptLivePreview] : []),
        });
    }, [livePreview]);

    return <div className="se-editor" ref={hostRef} />;
}
