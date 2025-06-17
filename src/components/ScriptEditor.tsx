import React from "react";
import { SceneHeading, Action, Character, Parenthetical, Dialogue, Transition } from "./ScriptParts";

interface Props {
    initialContent: string;
    onChange: () => void;
};

export const ScriptEditor = ({ initialContent, onChange }: Props) => {
    return (
        <div style={{ padding: "1rem", color: "var(--text-normal)" }}>
            <h1>🎬 Script Editor</h1>
            <p>This is your custom React component.</p>
            <br />
            <SceneHeading>INT. KITCHEN – DAY</SceneHeading>
            <Action>The room is silent, save for the ticking clock.</Action>
            <Character>JANE</Character>
            <Parenthetical>(whispering)</Parenthetical>
            <Dialogue>I can’t believe this is happening.</Dialogue>
            <Transition>CUT TO:</Transition>
        </div>
    );
};