import {
    acceptCompletion,
    autocompletion,
    Completion,
    CompletionContext,
    CompletionResult,
    insertCompletionText,
    pickedCompletion,
} from "@codemirror/autocomplete";
import { Extension, Prec } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { i18n } from "../../i18n/i18n";
import { SupportedLanguage } from "../../i18n/types";

function resolveAutocompleteLanguage(lineText: string, docText: string): SupportedLanguage {
    if (/[\u0590-\u05FF]/.test(lineText)) {
        return "he";
    }
    if (/[a-zA-Z\u00C0-\u017F]/.test(lineText)) {
        const current = i18n.getCurrentLanguage();
        return current === "he" ? "en" : current;
    }

    const bodyText = docText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
    if (/[\u0590-\u05FF]/.test(bodyText)) {
        return "he";
    }
    if (/[a-zA-Z\u00C0-\u017F]/.test(bodyText)) {
        const current = i18n.getCurrentLanguage();
        return current === "he" ? "en" : current;
    }

    return i18n.getCurrentLanguage();
}

function getLocationCompletions(
    _context: CompletionContext,
    _lineFrom: number,
    _afterMarker: string
): CompletionResult | null {
    // Location autocomplete will be added here in the future
    return null;
}

export function sceneHeadingCompletionSource(context: CompletionContext): CompletionResult | null {
    const line = context.state.doc.lineAt(context.pos);
    const textBeforeCursor = line.text.slice(0, context.pos - line.from);

    // Scene headings start with "# "
    if (!textBeforeCursor.startsWith("# ")) {
        return null;
    }

    const afterMarker = textBeforeCursor.slice(2);
    const markerEndPos = line.from + 2;

    // 1. {TIME OF DAY} completion: triggered after "<location> - "
    const timeMatch = /^.+\s+-\s+([^\r\n-]*)$/.exec(afterMarker);
    if (timeMatch) {
        const query = timeMatch[1];
        const from = context.pos - query.length;
        const lang = resolveAutocompleteLanguage(line.text, context.state.doc.toString());
        const { timesOfDay } = i18n.getTranslations(lang).autocomplete;

        const hasExactMatch = timesOfDay.some(t => t.toLowerCase() === query.toLowerCase());
        const hasLongerPrefixMatch = timesOfDay.some(
            t => t.length > query.length && t.toLowerCase().startsWith(query.toLowerCase())
        );
        if (!context.explicit && query.length > 0 && hasExactMatch && !hasLongerPrefixMatch) {
            return null;
        }

        const options: Completion[] = timesOfDay.map((time, index) => ({
            label: time,
            type: "keyword",
            boost: timesOfDay.length - index,
        }));

        return {
            from,
            options,
        };
    }

    // 2. <location> completion: after "{INT/EXT}. " and before " - "
    if (/\s/.test(afterMarker)) {
        return getLocationCompletions(context, line.from, afterMarker);
    }

    // 3. {INT/EXT} completion: right after "# "
    const from = markerEndPos;
    const lang = resolveAutocompleteLanguage(line.text, context.state.doc.toString());
    const { sceneTypes } = i18n.getTranslations(lang).autocomplete;

    const options: Completion[] = sceneTypes.map((sceneType, index) => ({
        label: sceneType,
        type: "keyword",
        boost: sceneTypes.length - index,
        apply: (view: EditorView, completion: Completion, applyFrom: number, applyTo: number) => {
            const nextChar = view.state.doc.sliceString(applyTo, applyTo + 1);
            const textToInsert = nextChar === " " ? sceneType : `${sceneType} `;
            view.dispatch({
                ...insertCompletionText(view.state, textToInsert, applyFrom, applyTo),
                annotations: pickedCompletion.of(completion),
            });
        },
    }));

    return {
        from,
        options,
    };
}

export function scriptAutocomplete(): Extension {
    return [
        autocompletion({
            override: [sceneHeadingCompletionSource],
            activateOnTyping: true,
            activateOnTypingDelay: 0,
            icons: false,
            tooltipClass: (state) => {
                const pos = state.selection.main.head;
                const line = state.doc.lineAt(pos);
                const lang = resolveAutocompleteLanguage(line.text, state.doc.toString());
                return lang === "he" ? "cm-script-autocomplete-rtl" : "";
            },
        }),
        Prec.highest(
            keymap.of([
                { key: "Tab", run: acceptCompletion },
            ])
        ),
    ];
}
