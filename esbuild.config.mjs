import esbuild from "esbuild";

const isProd = process.argv.includes("--prod");

esbuild.build({
    entryPoints: {
        main: "src/index.ts",
        styles: "src/styles.css",
    },
    bundle: true,
    outdir: "./",

    format: "cjs",
    platform: "node",
    target: "es2018",

    jsx: "automatic",

    loader: {
        ".ts": "ts",
        ".tsx": "tsx",
        ".css": "css",
        ".woff2": "dataurl",
        ".woff": "dataurl",
        ".ttf": "dataurl",
        ".otf": "dataurl",
    },

    external: ["obsidian"],
}).catch(() => process.exit(1));