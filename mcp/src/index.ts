import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths relative to this file: mcp/src/index.ts → skills/skills/remotion/
const SKILLS_ROOT = path.resolve(__dirname, "../../skills/skills/remotion");
const RULES_DIR = path.join(SKILLS_ROOT, "rules");
const ASSETS_DIR = path.join(RULES_DIR, "assets");
const SKILL_MD = path.join(SKILLS_ROOT, "SKILL.md");

const server = new McpServer({
  name: "remotion-skills",
  version: "1.0.0",
});

// ── Tool: list_skills ────────────────────────────────────────────────────────
server.tool(
  "list_skills",
  "List every available Remotion skill topic. Returns topic names that can be passed to get_skill.",
  {},
  async () => {
    const topics = fs
      .readdirSync(RULES_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();

    const assets = fs
      .readdirSync(ASSETS_DIR)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(/\.tsx$/, ""));

    const lines = [
      "## Remotion skill topics\n",
      "Pass any topic name to `get_skill` to read it.\n",
      "### Rules (markdown guides)",
      ...topics.map((t) => `- ${t}`),
      "",
      "### Reference assets (React/TSX components)",
      ...assets.map((a) => `- ${a}  → pass to \`get_skill_asset\``),
      "",
      'Use `get_skill topic="overview"` for the top-level SKILL.md.',
    ];

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// ── Tool: get_skill ──────────────────────────────────────────────────────────
server.tool(
  "get_skill",
  'Get the full content of a Remotion skill topic. Use topic="overview" for the main SKILL.md entry point.',
  {
    topic: z
      .string()
      .describe(
        'Skill topic name, e.g. "timing", "audio", "transitions". Use "overview" for the top-level SKILL.md.'
      ),
  },
  async ({ topic }) => {
    const filePath =
      topic === "overview"
        ? SKILL_MD
        : path.join(RULES_DIR, `${topic}.md`);

    // Prevent path traversal
    const resolved = path.resolve(filePath);
    if (
      !resolved.startsWith(path.resolve(SKILLS_ROOT)) ||
      resolved.includes("..")
    ) {
      return {
        content: [{ type: "text", text: `Invalid topic name: "${topic}"` }],
        isError: true,
      };
    }

    if (!fs.existsSync(resolved)) {
      const available = fs
        .readdirSync(RULES_DIR)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""))
        .join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Topic "${topic}" not found.\n\nAvailable topics: ${available}`,
          },
        ],
        isError: true,
      };
    }

    const content = fs.readFileSync(resolved, "utf-8");
    return { content: [{ type: "text", text: content }] };
  }
);

// ── Tool: get_skill_asset ────────────────────────────────────────────────────
server.tool(
  "get_skill_asset",
  "Get the source code of a Remotion reference asset component (TSX). Use list_skills to see available asset names.",
  {
    name: z
      .string()
      .describe(
        'Asset file name without extension, e.g. "charts-bar-chart", "text-animations-typewriter".'
      ),
  },
  async ({ name }) => {
    const filePath = path.join(ASSETS_DIR, `${name}.tsx`);
    const resolved = path.resolve(filePath);

    if (!resolved.startsWith(path.resolve(ASSETS_DIR))) {
      return {
        content: [{ type: "text", text: `Invalid asset name: "${name}"` }],
        isError: true,
      };
    }

    if (!fs.existsSync(resolved)) {
      const available = fs
        .readdirSync(ASSETS_DIR)
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => f.replace(/\.tsx$/, ""))
        .join(", ");
      return {
        content: [
          {
            type: "text",
            text: `Asset "${name}" not found.\n\nAvailable assets: ${available}`,
          },
        ],
        isError: true,
      };
    }

    const content = fs.readFileSync(resolved, "utf-8");
    return {
      content: [{ type: "text", text: `\`\`\`tsx\n${content}\n\`\`\`` }],
    };
  }
);

// ── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
