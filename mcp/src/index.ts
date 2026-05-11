import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Repo layout from this file (mcp/src/index.ts):
//   ../../skills/skills/remotion/    → SKILL.md + rules/*.md + rules/assets/*.tsx
//   ../../skills/src/                → Root.tsx, index.ts, backgrounds/*
//   ../../skills/                    → package.json, tsconfig.json
const REPO_ROOT = path.resolve(__dirname, "../..");
const SKILLS_PKG = path.join(REPO_ROOT, "skills");
const SKILL_ROOT = path.join(SKILLS_PKG, "skills/remotion");
const RULES_DIR = path.join(SKILL_ROOT, "rules");
const ASSETS_DIR = path.join(RULES_DIR, "assets");
const BG_DIR = path.join(SKILLS_PKG, "src/backgrounds");
const SRC_DIR = path.join(SKILLS_PKG, "src");

const SKILL_MD = path.join(SKILL_ROOT, "SKILL.md");

// Setup files mapped by friendly name → absolute path
const SETUP_FILES: Record<string, string> = {
  "Root.tsx": path.join(SRC_DIR, "Root.tsx"),
  "index.ts": path.join(SRC_DIR, "index.ts"),
  "package.json": path.join(SKILLS_PKG, "package.json"),
  "tsconfig.json": path.join(SKILLS_PKG, "tsconfig.json"),
};

const server = new McpServer({
  name: "remotion-skills",
  version: "1.1.0",
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const listFiles = (dir: string, ext: string) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .map((f) => f.replace(new RegExp(`${ext.replace(".", "\\.")}$`), ""))
    .sort();

const safeRead = (file: string, allowedDir: string) => {
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(allowedDir))) return null;
  if (!fs.existsSync(resolved)) return null;
  return fs.readFileSync(resolved, "utf-8");
};

const errorReply = (text: string) => ({
  content: [{ type: "text" as const, text }],
  isError: true,
});

const textReply = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

// ── Tool: list_skills ────────────────────────────────────────────────────────
server.tool(
  "list_skills",
  "List every available Remotion skill topic (markdown rules).",
  {},
  async () => {
    const topics = listFiles(RULES_DIR, ".md");
    const lines = [
      "## Remotion skill topics\n",
      "Call `get_skill` with any topic name below, or `get_skill topic=\"overview\"` for SKILL.md.\n",
      ...topics.map((t) => `- ${t}`),
    ];
    return textReply(lines.join("\n"));
  }
);

// ── Tool: get_skill ──────────────────────────────────────────────────────────
server.tool(
  "get_skill",
  'Read a Remotion skill topic. Use topic="overview" for the top-level SKILL.md.',
  {
    topic: z
      .string()
      .describe(
        'Topic name like "timing", "audio", "transitions". Use "overview" for SKILL.md.'
      ),
  },
  async ({ topic }) => {
    const filePath =
      topic === "overview" ? SKILL_MD : path.join(RULES_DIR, `${topic}.md`);
    const content = safeRead(filePath, SKILL_ROOT);
    if (content === null) {
      const available = listFiles(RULES_DIR, ".md").join(", ");
      return errorReply(
        `Topic "${topic}" not found.\nAvailable: ${available}, or "overview"`
      );
    }
    return textReply(content);
  }
);

// ── Tool: list_skill_assets ──────────────────────────────────────────────────
server.tool(
  "list_skill_assets",
  "List Remotion reference asset components (TSX files under rules/assets/).",
  {},
  async () => {
    const assets = listFiles(ASSETS_DIR, ".tsx");
    const lines = [
      "## Skill reference assets (TSX)\n",
      "Call `get_skill_asset` with any name below.\n",
      ...assets.map((a) => `- ${a}`),
    ];
    return textReply(lines.join("\n"));
  }
);

// ── Tool: get_skill_asset ────────────────────────────────────────────────────
server.tool(
  "get_skill_asset",
  "Read the source of a Remotion skill reference asset (TSX).",
  {
    name: z
      .string()
      .describe(
        'Asset file name without extension, e.g. "charts-bar-chart".'
      ),
  },
  async ({ name }) => {
    const filePath = path.join(ASSETS_DIR, `${name}.tsx`);
    const content = safeRead(filePath, ASSETS_DIR);
    if (content === null) {
      const available = listFiles(ASSETS_DIR, ".tsx").join(", ");
      return errorReply(`Asset "${name}" not found.\nAvailable: ${available}`);
    }
    return textReply("```tsx\n" + content + "\n```");
  }
);

// ── Tool: list_backgrounds ───────────────────────────────────────────────────
server.tool(
  "list_backgrounds",
  "List all background composition components and their shared utilities.",
  {},
  async () => {
    const all = fs
      .readdirSync(BG_DIR)
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .sort();
    const lines = [
      "## Background components & utilities\n",
      "Call `get_background` with any file name (with extension) below.\n",
      ...all.map((f) => `- ${f}`),
    ];
    return textReply(lines.join("\n"));
  }
);

// ── Tool: get_background ─────────────────────────────────────────────────────
server.tool(
  "get_background",
  "Read the source of any background component or shared utility (Bg*.tsx, Shared.tsx, palette.ts).",
  {
    file: z
      .string()
      .describe(
        'File name with extension, e.g. "Bg01Pearl.tsx", "Shared.tsx", "palette.ts".'
      ),
  },
  async ({ file }) => {
    const filePath = path.join(BG_DIR, file);
    const content = safeRead(filePath, BG_DIR);
    if (content === null) {
      const available = fs
        .readdirSync(BG_DIR)
        .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
        .join(", ");
      return errorReply(`File "${file}" not found.\nAvailable: ${available}`);
    }
    const lang = file.endsWith(".ts") ? "ts" : "tsx";
    return textReply("```" + lang + "\n" + content + "\n```");
  }
);

// ── Tool: list_setup ─────────────────────────────────────────────────────────
server.tool(
  "list_setup",
  "List project setup files needed to bootstrap a Remotion project replicating this one (Root.tsx, index.ts, package.json, tsconfig.json).",
  {},
  async () => {
    const lines = [
      "## Project setup files\n",
      "Call `get_setup_file` with any of:\n",
      ...Object.keys(SETUP_FILES).map((n) => `- ${n}`),
    ];
    return textReply(lines.join("\n"));
  }
);

// ── Tool: get_setup_file ─────────────────────────────────────────────────────
server.tool(
  "get_setup_file",
  "Read a project setup file (Root.tsx, index.ts, package.json, tsconfig.json).",
  {
    name: z
      .string()
      .describe('One of: "Root.tsx", "index.ts", "package.json", "tsconfig.json".'),
  },
  async ({ name }) => {
    const filePath = SETUP_FILES[name];
    if (!filePath) {
      return errorReply(
        `Unknown setup file "${name}". Available: ${Object.keys(SETUP_FILES).join(", ")}`
      );
    }
    if (!fs.existsSync(filePath)) {
      return errorReply(`Setup file "${name}" missing on disk.`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(name).slice(1) || "text";
    return textReply("```" + ext + "\n" + content + "\n```");
  }
);

// ── Tool: list_all ───────────────────────────────────────────────────────────
server.tool(
  "list_all",
  "One-shot inventory: every skill, asset, background, utility, and setup file the server exposes.",
  {},
  async () => {
    const topics = listFiles(RULES_DIR, ".md");
    const assets = listFiles(ASSETS_DIR, ".tsx");
    const bgs = fs
      .readdirSync(BG_DIR)
      .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
      .sort();
    const setup = Object.keys(SETUP_FILES);

    const lines = [
      "# Full inventory\n",
      `## Skills — markdown rules (${topics.length} + overview) — use \`get_skill\``,
      "- overview  → SKILL.md",
      ...topics.map((t) => `- ${t}`),
      "",
      `## Skill reference assets (${assets.length}) — use \`get_skill_asset\``,
      ...assets.map((a) => `- ${a}`),
      "",
      `## Backgrounds & utilities (${bgs.length}) — use \`get_background\``,
      ...bgs.map((b) => `- ${b}`),
      "",
      `## Project setup (${setup.length}) — use \`get_setup_file\``,
      ...setup.map((s) => `- ${s}`),
    ];
    return textReply(lines.join("\n"));
  }
);

// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
