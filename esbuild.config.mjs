import esbuild from "esbuild";
import process from "process";

const production = process.argv[2] === "production";

await esbuild.build({
  entryPoints: ["main.ts"],
  bundle: true,
  // 必须复用 Obsidian 自带的 CodeMirror 实例，避免扩展对象跨实例不兼容。
  external: [
    "obsidian",
    "@codemirror/language",
    "@codemirror/state",
    "@codemirror/view"
  ],
  format: "cjs",
  platform: "node",
  target: "es2022",
  sourcemap: production ? false : "inline",
  minify: production,
  outfile: "main.js",
  logLevel: "info"
});
