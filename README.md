# pi-guideline-loader

An intelligent context-loading extension for `pi` that automatically injects `CLAUDE.md` and `AGENTS.md` guidelines into the agent's system prompt.

## Features

- **Hierarchical Discovery**: Walks up from the current working directory to the root to find global and local guidelines.
- **Interaction-Aware Relevance**: Scans recent session history for package paths (e.g., `packages/core/`) and dynamically loads the associated guidelines, even if your CWD is at the project root.
- **Context Safeguards**: Includes a character limit (`MAX_CHARS`) to prevent prompt bloat.
- **Contextual Labeling**: Clearly labels guidelines by their directory source.

## Installation

### From GitHub (Recommended)

Add the following to your `pi` `settings.json`:

```json
{
  "packages": [
    "git:github.com/your-username/pi-guideline-loader"
  ]
}
```

Then run `/reload` in `pi`.

### Local Development

1. Clone the repo into `~/.pi/agent/extensions/` or `.pi/extensions/`.
2. Run `/reload`.

## Configuration

The extension is currently configured via constants in `src/index.ts`:
- `GUIDELINE_FILES`: The list of filenames to look for (defaults to `CLAUDE.md`, `AGENTS.md`).
- `MAX_CHARS`: Maximum number of characters to inject (defaults to 15,000).
