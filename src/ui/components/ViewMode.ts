import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder, StateField, Text } from "@codemirror/state";
import { finishRenderMath, renderMath } from "obsidian";
import { isRTL } from "../../i18n/i18n";

const SCENE_REGEX = /^# /;

function computeSceneNumbers(doc: Text): Map<number, number> {
    const map = new Map<number, number>();
    let count = 0;
    for (let i = 1; i <= doc.lines; i++) {
        if (SCENE_REGEX.test(doc.line(i).text)) {
            count++;
            map.set(i, count);
        }
    }
    return map;
}

export const sceneNumberField = StateField.define<Map<number, number>>({
    create(state) {
        return computeSceneNumbers(state.doc);
    },
    update(value, tr) {
        return tr.docChanged ? computeSceneNumbers(tr.state.doc) : value;
    },
});

const LINE_RULES: { regex: RegExp; className: string; markerLength: number }[] = [
    { regex: /^# .*/, className: "cm-script-scene", markerLength: 2 },
    { regex: /^## .*/, className: "cm-script-subheader", markerLength: 3 },
    { regex: /^@ .*/, className: "cm-script-character", markerLength: 2 },
    { regex: /^" .*/, className: "cm-script-dialogue", markerLength: 2 },
    { regex: /^"" .*/, className: "cm-script-centered-dialogue", markerLength: 3 },
    { regex: /^- .*/, className: "cm-script-transition", markerLength: 2 },
];

class MathWidget extends WidgetType {
    constructor(private source: string, private display: boolean) {
        super();
    }

    toDOM(): HTMLElement {
        const el = renderMath(this.source, this.display);
        finishRenderMath();
        return el;
    }

    eq(other: MathWidget): boolean {
        return other.source === this.source && other.display === this.display;
    }
}

function getLineTextAlign(
    className: string | undefined,
    dir: "ltr" | "rtl"
): "left" | "right" | "center" {
    if (className === "cm-script-centered-dialogue" || className === "cm-script-character") {
        return "center";
    }
    if (className === "cm-script-transition") {
        return dir === "ltr" ? "right" : "left";
    }
    return dir === "ltr" ? "left" : "right";
}

function clampPos(doc: Text, pos: number): number {
    return Number.isFinite(pos) ? Math.max(0, Math.min(doc.length, pos)) : 0;
}

function getVisibleLineNumbers(view: EditorView, doc: Text): number[] {
    const visibleLineNumbers = new Set<number>();
    const ranges = view.visibleRanges.length ? view.visibleRanges : [{ from: 0, to: doc.length }];

    for (const { from, to } of ranges) {
        const safeFrom = clampPos(doc, Math.min(from, to));
        const safeTo = clampPos(doc, Math.max(from, to));

        const startLine = doc.lineAt(safeFrom).number;
        const endLine = doc.lineAt(
            safeTo === doc.length && doc.length > 0 ? doc.length - 1 : safeTo
        ).number;

        for (let n = startLine; n <= endLine; n++) {
            visibleLineNumbers.add(n);
        }
    }

    return Array.from(visibleLineNumbers).sort((a, b) => a - b);
}

function buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;

    const cursor = clampPos(doc, view.state.selection.main.head);
    const cursorLine = doc.lineAt(cursor).number;

    const sceneNumbers = view.state.field(sceneNumberField, false) ?? new Map<number, number>();
    const totalDigits = Math.max(1, sceneNumbers.size.toString().length);

    const addReplace = (
        from: number,
        to: number,
        spec: Parameters<typeof Decoration.replace>[0] = {}
    ) => {
        if (from < 0 || to > doc.length || to <= from) return;
        builder.add(from, to, Decoration.replace(spec));
    };

    for (const lineNo of getVisibleLineNumbers(view, doc)) {
        const line = doc.line(lineNo);
        const text = line.text;
        const cursorOnLine = lineNo === cursorLine;
        const dir = isRTL(text) ? "rtl" : "ltr";
        const rule = LINE_RULES.find((r) => r.regex.test(text));

        const attributes: Record<string, string> = {
            dir,
            style: `text-align: ${getLineTextAlign(rule?.className, dir)};`,
        };

        const sceneNumber = sceneNumbers.get(lineNo);
        if (sceneNumber !== undefined) {
            attributes["data-scene-number"] = String(sceneNumber).padStart(totalDigits, "0");
        }

        builder.add(
            line.from,
            line.from,
            Decoration.line({
                class: rule?.className,
                attributes,
            })
        );

        if (rule && !cursorOnLine && rule.markerLength > 0) {
            const markerEnd = Math.min(line.from + rule.markerLength, line.to);
            addReplace(line.from, markerEnd);
        }

        const boldRegex = /\*\*(.+?)\*\*/g;
        let match: RegExpExecArray | null;
        while ((match = boldRegex.exec(text))) {
            const start = line.from + match.index;
            const end = start + match[0].length;
            if (end > line.to) break;

            if (cursorOnLine && cursor >= start && cursor <= end) {
                builder.add(
                    start,
                    end,
                    Decoration.mark({ class: "cm-script-bold cm-script-marker-visible" })
                );
            } else {
                addReplace(start, start + 2);
                builder.add(start + 2, end - 2, Decoration.mark({ class: "cm-script-bold" }));
                addReplace(end - 2, end);
            }
        }

        const italicRegex = /_(.+?)_/g;
        while ((match = italicRegex.exec(text))) {
            const start = line.from + match.index;
            const end = start + match[0].length;
            if (end > line.to) break;

            if (cursorOnLine && cursor >= start && cursor <= end) {
                builder.add(
                    start,
                    end,
                    Decoration.mark({ class: "cm-script-italic cm-script-marker-visible" })
                );
            } else {
                addReplace(start, start + 1);
                builder.add(start + 1, end - 1, Decoration.mark({ class: "cm-script-italic" }));
                addReplace(end - 1, end);
            }
        }

        const mathRegex = /\${1,2}([^$]+?)\${1,2}/g;
        while ((match = mathRegex.exec(text))) {
            const start = line.from + match.index;
            const end = start + match[0].length;
            if (end > line.to) break;

            if (cursorOnLine && cursor >= start && cursor <= end) {
                builder.add(
                    start,
                    end,
                    Decoration.mark({ class: "cm-script-math cm-script-marker-visible" })
                );
            } else {
                const display = match[0].startsWith("$$");
                addReplace(start, end, { widget: new MathWidget(match[1], display) });
            }
        }
    }

    return builder.finish();
}

class ScriptLivePreviewPlugin {
    decorations: DecorationSet = Decoration.none;

    constructor(view: EditorView) {
        this.decorations = this.safeBuild(view);
    }

    update(update: ViewUpdate): void {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = this.safeBuild(update.view);
        }
    }

    private safeBuild(view: EditorView): DecorationSet {
        try {
            return buildDecorations(view);
        } catch (e) {
            console.error("scriptLivePreview decoration error:", e);
            return Decoration.none;
        }
    }
}

export const scriptLivePreview = ViewPlugin.fromClass(ScriptLivePreviewPlugin, {
    decorations: (v) => v.decorations,
});
