# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains official AI Agent skills from the Chroma team. Skills are documentation packages that help AI agents integrate Chroma vector database into projects.

## Commands

```sh
# Build skills (compiles templates + code examples into skills/ output)
bun run build

# Create new skill template (interactive or with --name and --description flags)
bun run new

# Validate code examples
npm run validate              # Both TypeScript and Python
npm run validate:typescript   # TypeScript only (uses npx tsc)
npm run validate:python       # Python only (uses .venv/bin/python)

# Set up Python virtual environment for validation
uv venv .venv && uv pip install -r requirements.txt
```

## Architecture

### Build System

The build process (`scripts/build-skills.ts`) transforms source files into distributable skills:

1. **Source location**: `src/<skill>/` contains skill-specific docs, templates, and code examples
2. **Composable sources**: `src/<skill>/skill.json` can list layered source directories like `["chroma-shared", "chroma-local"]`
3. **Shared content**: `src/chroma-shared/` contains docs and templates reused by multiple skills
4. **Override order**: Later source directories override earlier ones when they define the same template or general doc
5. **Output location**: `skills/<skill>/` contains the built skill files
5. **Template processing**: Templates in `templates/*.md` contain `{{CODE:snippet-name}}` placeholders
6. **Code snippets**: Code files in `code/{typescript,python}/` define snippets with `@snippet:name` and `@end` markers
7. **Build output**: Each template generates two files: `skills/<skill>/<topic>/typescript.md` and `python.md`

### Directory Structure

```
src/chroma-shared/
├── templates/         # Shared markdown templates with {{CODE:*}} placeholders
└── general/           # Shared language-agnostic docs

src/<skill>/
├── skill.json         # Optional layered source config
├── SKILL.md           # Main skill description (copied to output with topic list appended)
├── templates/         # Skill-specific markdown templates
├── code/
│   ├── typescript/    # .ts files with @snippet markers
│   └── python/        # .py files with @snippet markers
└── general/           # Skill-specific language-agnostic docs

skills/<skill>/        # Built output (generated, don't edit directly)
```

### Code Snippet Format

In code files, define snippets like this:

```typescript
// @snippet:example-name
const code = "here";
// @end
```

```python
# @snippet:example-name
code = "here"
# @end
```

Reference in templates: `{{CODE:example-name}}`

### Pre-commit Hooks

The repo uses pre-commit to run validation and build before commits. Install with:
```sh
pip install pre-commit && pre-commit install
```

## Code Style

- Uses Biome for formatting (2-space indent, single quotes, semicolons, ES5 trailing commas)
- TypeScript validation: strict mode with ESNext modules
- Python validation: syntax check via py_compile
