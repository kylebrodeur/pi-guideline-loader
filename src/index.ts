import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { existsSync } from "node:fs";

/**
 * This extension automatically discovers and injects the contents of 
 * CLAUDE.md and AGENTS.md files found in the current working directory,
 * its parent hierarchies, and based on the most recently interacted files.
 */
export default function (pi: ExtensionAPI) {
  const GUIDELINE_FILES = ["CLAUDE.md", "AGENTS.md"];
  const MAX_CHARS = 15000;

  pi.on("before_agent_start", async (event, ctx) => {
    let totalContent = "";
    const addedPaths = new Set<string>();

    async function loadGuidelinesFromDir(dir: string) {
      if (!dir || addedPaths.has(dir)) return;
      addedPaths.add(dir);

      for (const fileName of GUIDELINE_FILES) {
        try {
          const filePath = join(dir, fileName);
          if (existsSync(filePath)) {
            const content = await readFile(filePath, "utf8");
            if (content && content.trim()) {
              const label = dir === ctx.cwd ? "Local" : dir;
              const header = `\n### ${fileName} (${label})\n`;
              const entry = `${header}${content.trim()}\n`;
              
              if ((totalContent.length + entry.length) <= MAX_CHARS) {
                totalContent += entry;
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 1. Ancestral Walk (standard discovery)
    let currentDir = ctx.cwd;
    const rootDir = "/"; // Fallback
    while (currentDir && currentDir !== dirname(currentDir)) {
      await loadGuidelinesFromDir(currentDir);
      currentDir = dirname(currentDir);
    }

    // 2. Cheap Contextual Relevance (Interaction-based)
    const entries = ctx.sessionManager.getBranch();
    const recentFiles = new Set<string>();
    
    const lookback = entries.slice(-50);
    for (const entry of lookback) {
      if (entry.type === "message") {
        const text = JSON.stringify(entry.message);
        const matches = text.match(/packages\/[a-zA-Z0-9\-_.]+\//g);
        if (matches) {
          matches.forEach(m => {
            const dirPath = join(ctx.cwd, m);
            recentFiles.add(dirPath);
          });
        }
      }
    }

    for (const path of recentFiles) {
      await loadGuidelinesFromDir(path);
    }

    if (totalContent) {
      return {
        systemPrompt: `${event.systemPrompt}\n\n--- PROJECT GUIDELINES ---\n${totalContent}\n------------------------`,
      };
    }
  });
}
