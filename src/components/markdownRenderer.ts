import MarkdownIt from "markdown-it";
import mk from "markdown-it-mathjax3";

const md = new MarkdownIt({ html: false }).use(mk);

export function renderMarkdownInline(text: string): string {
    return md.renderInline(text);
}