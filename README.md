# 🎬 Obsidian Script Editor

Write and structure screenplays directly inside Obsidian using an intuitive, Markdown-inspired format.  
Supports live formatting, metadata, character management, and PDF export — all within your writing vault.

## ✨ Features

- 📝 **Live Preview Mode** – Automatically formats your screenplay as you type using intuitive syntax.
- 🧠 **Source Mode** – Raw text editing with Obsidian styling.
- 🎭 **Character Integration** – Link character names to their own Markdown notes.
- 🧾 **Script Metadata Editor** – Title, authorship, production company, date, and more.
- 📄 **PDF Export** – Generate a properly formatted screenplay PDF (with full Hebrew support!).
- 🧠 **Custom Parsing Engine** – Built-in parser for `.script` files with metadata and formatting support.
- 💻 **Keyboard Shortcut Support** – Quick toggles and editable hotkeys.

### ❓  Future Features
there are a few features I plan to add in the future:

- [ ] 📊 **Statistics Panel** – Get word counts, scene counts, runtime estimate, and more.
- [ ] 🗂️ **Scene Outline View** – Jump to any scene quickly.
- [ ] 💬 **Inline Comments** – Add line-specific notes while writing.
- [ ] 📚 **Plotting Notes** - Create and plot your screenplay before you write it's script inside obsidian.
- [ ] ⛲ **Export** - Exporting to Fountain, Final Draft and more.

---

## 🔤 Writing Format

Write scripts using simplified Markdown-style syntax:

| Syntax         | Interpreted As         |
|----------------|------------------------|
| `# Scene Heading`  | Scene heading (e.g. INT./EXT.) |
| `## Subheading`    | Sub headers (e.g. FLASHBACK) |
| Normal text        | Action lines |
| `@NAME`            | Character name |
| `"dialogue`        | Dialogue line |
| `""centered`       | Centered Dialog (e.g. (whispering) or (afraid) ext.) |
| `-CUT TO:`         | Transitions |


## 🛠 Plugin Settings

- **Character Folder**: Select a folder where all character notes are stored. The editor will use it to auto-complete characters and open their profiles.

---

## 📦 Installation

### From Source

1. Clone/download this repo into your Obsidian plugin folder: `.obsidian/plugins/script-editor/`
2. Run `npm install && npm run build` inside the folder.
3. Enable the plugin in Obsidian's community plugins section.

## 🧑‍💻 Developer Notes

Written in **TypeScript + React**, styled with **inline styles**, and uses `pdfkit` for PDF generation.

Contributions and suggestions are welcome! (if someone knows how to enable tailwind that will be great :) )