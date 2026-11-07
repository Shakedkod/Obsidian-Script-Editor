# 🎬 Script Editor for Obsidian

[![Version](https://img.shields.io/github/v/release/ShakedKod/Obsidian-Script-Editor?style=flat-square&color=8A2BE2)](https://github.com/ShakedKod/Obsidian-Script-Editor/releases)
[![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-blueviolet?style=flat-square&logo=obsidian)](https://obsidian.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

**Script Editor** is a powerful, distraction-free screenwriting plugin for [Obsidian](https://obsidian.md). Write industry-standard screenplays directly in your vault with a dynamic live preview, smart autocomplete, real-time runtime estimates, and professional PDF export — with full support for both **LTR (English)** and **RTL (Hebrew)** scripts.

---

## ✨ Features

- **📺 CodeMirror 6 Live Preview**: Screenplay text is automatically formatted into industry-standard layout (scene headings, character cues, dialogue blocks, parentheticals, and transitions) as you write.
- **⚡ Smart Screenplay Autocomplete**:
  - Context-aware autocomplete for scene types (`INT.`, `EXT.`, `בפנים.`, `בחוץ.`, etc.).
  - Time-of-day suggestions (`DAY`, `NIGHT`, `LATER`, `בוקר`, `ערב`, etc.) after typing a hyphen (`-`).
  - Automatic language detection dynamically adjusts suggestions between English and Hebrew.
- **📄 Industry-Standard PDF Export**:
  - Exports to Hollywood-standard screenplay format (12pt Courier, precise inch margins, header numbering, and title page).
  - Built-in embedded font engine for Hebrew (**Alef**) and English (**Courier**).
- **⏱️ Live Runtime Estimator**: Real-time status bar indicator (`🎬 45 min`) calculating estimated screen time at the industry-standard rate (~130 words per minute).
- **📋 Script Metadata GUI**: Dedicated visual properties editor for Title, Subtitle, Writers, Production Company, Date, and folder scopes.
- **🎭 Character Notes Integration**: Link character cues directly to Markdown notes in your vault's character directory for worldbuilding and character development.
- **🔄 Instant View Switching**: Easily toggle between **Live Preview**, raw **Source Mode**, and **Metadata Editor** via pane options or Command Palette.

---

## ✍️ Screenplay Syntax Cheat Sheet

Script Editor uses intuitive, lightweight Markdown-friendly prefixes to identify screenplay components:

| Element | Syntax Prefix | Example |
| :--- | :--- | :--- |
| **Scene Heading** | `# ` | `# INT. COFFEE SHOP - DAY`<br>`# בחוץ. רחוב סואן - לילה` |
| **Character Cue** | `@ ` | `@ WALTER`<br>`@ ליהי` |
| **Parenthetical** | `"" ` | `"" (quietly, looking at the door)` |
| **Dialogue** | `" ` | `" Are we sure about this plan?` |
| **Transition** | `! ` | `! DISSOLVE TO:`<br>`! חיתוך ל:` |
| **Action / Description** | *(plain text)* | `He sets his steaming coffee cup on the wooden table.` |

### Title Page & Frontmatter
At the top of your `.script` file, include YAML metadata (or use the visual Metadata tab):

```yaml
---
title: The Silent Signal
subtitle: Pilot Episode
writers:
  - Jane Doe
  - John Smith
prodCompany: Nebula Pictures
date: 2026-11-07
characterFolder: Characters
locationFolder: Locations
---
```

---

## ⌨️ Commands & Shortcuts

Access these from the Obsidian Command Palette (`Ctrl/Cmd + P`) or the pane action menu:

* **Script Editor: Toggle preview mode** — Switch between WYSIWYG screenplay layout and raw source code.
* **Script Editor: Edit script metadata** — Open the metadata form to edit title, author, and production info.
* **Script Editor: Export script to PDF** — Generate and save a print-ready screenplay PDF.

---

## 📥 Installation

### Manual Installation
1. Download the latest release assets (`main.js`, `manifest.json`, `styles.css`) from the [Releases](https://github.com/ShakedKod/Obsidian-Script-Editor/releases) page.
2. In your Obsidian vault, navigate to:
   ```
   <VaultFolder>/.obsidian/plugins/
   ```
3. Create a folder named `script-editor` and place the downloaded files inside.
4. Open Obsidian **Settings** → **Community Plugins**, reload plugins, and enable **Script Editor**.

---

## 🛠️ Development

If you want to contribute or modify the plugin:

```bash
# Clone the repository
git clone https://github.com/ShakedKod/Obsidian-Script-Editor.git
cd Obsidian-Script-Editor

# Install dependencies
npm install --legacy-peer-deps

# Start development build with watch mode
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
