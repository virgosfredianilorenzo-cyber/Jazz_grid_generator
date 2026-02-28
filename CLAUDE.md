# CLAUDE.md — Jazz Grid Generator

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Project Overview

**Jazz Grid Generator** is a tool for generating jazz chord grids (lead sheets / chord charts) from `.musicxml` files. MusicXML is an open standard for representing Western music notation, and this project parses it to produce printable or displayable jazz grids commonly used by musicians for rehearsal and performance.

- **License:** Apache 2.0
- **Author:** virgosfredianilorenzo-cyber
- **Status:** Early stage — source code not yet committed

## Repository Structure

```
Jazz_grid_generator/
├── CLAUDE.md          # This file
├── LICENSE            # Apache License 2.0
└── README.md          # Project description (French)
```

As source code is added, the expected layout is:

```
Jazz_grid_generator/
├── CLAUDE.md
├── LICENSE
├── README.md
├── src/               # Main source code
│   └── jazz_grid/
├── tests/             # Test files mirroring src/ structure
├── examples/          # Example .musicxml input files
├── output/            # Generated grid output (gitignored)
└── docs/              # Additional documentation
```

## Development Workflows

### Getting Started

Since the project has no build/dependency configuration yet, follow these steps when adding the first source files:

1. Choose and document the primary language (Python is a natural fit given `music21`, `lxml`, and `musicxml` ecosystem support)
2. Create a dependency manifest (`requirements.txt` or `pyproject.toml` for Python; `package.json` for Node.js)
3. Set up a virtual environment (Python) or install dependencies before running anything
4. Add a `.gitignore` appropriate for the chosen language

### Running the Project

No run commands exist yet. Once source code is present, document them here in the format:

```bash
# Example (Python):
python -m jazz_grid input.musicxml -o output.pdf
```

### Running Tests

No test framework is configured yet. When adding tests:

- Python: prefer `pytest` with tests in a `tests/` directory
- Node.js: prefer `jest` with tests co-located or in `__tests__/`
- Run tests before committing any functional change

Once configured, run tests with:

```bash
# Python (pytest)
pytest

# Node.js (jest)
npm test
```

### Linting and Formatting

No linter is configured yet. When adding source code:

- Python: use `ruff` for linting, `black` for formatting
- Node.js: use `eslint` + `prettier`

Run the formatter before committing:

```bash
# Python
black .
ruff check .
```

## Git Conventions

### Branches

- `master` — stable main branch; only merge tested, reviewed code
- `claude/<session-id>` — AI-generated work branches (e.g., `claude/claude-md-mm5ry2hoearvctix-KlTay`)
- Feature branches should follow: `feature/<short-description>`
- Bug fix branches: `fix/<short-description>`

### Commit Messages

Use the imperative mood, short subject line (≤72 chars), and optionally a body:

```
Add MusicXML chord parser module

Parse <harmony> elements from MusicXML to extract chord root, quality,
and bass note for grid rendering.
```

- Do **not** prefix with `feat:`, `fix:` etc. unless the project adopts Conventional Commits explicitly
- Reference relevant issue numbers if applicable: `Closes #12`

### Pull Requests

- Keep PRs focused on a single concern
- Ensure all tests pass before opening a PR
- Describe *what* changed and *why* in the PR body

## Key Domain Concepts

Understanding these concepts helps when working on the codebase:

| Term | Meaning |
|------|---------|
| **Jazz grid** | A chord chart layout showing chord symbols over a rhythmic grid (bars × beats) |
| **MusicXML** | Open XML format for music notation (`.musicxml` or `.xml` extension) |
| **`<harmony>`** | MusicXML element carrying chord symbol information |
| **`<measure>`** | MusicXML element representing one bar of music |
| **Chord quality** | Major, minor, dominant 7th, diminished, etc. |
| **Lead sheet** | Simplified score showing melody + chord symbols |

## Important Files to Know

| File | Purpose |
|------|---------|
| `README.md` | Public-facing project description |
| `LICENSE` | Apache 2.0 — all contributions must be compatible |
| `CLAUDE.md` | This file — AI assistant guidance |

## Guidelines for AI Assistants

1. **Read before editing.** Always read a file before modifying it; never guess at existing content.
2. **Minimal changes.** Only change what is necessary to fulfill the request; avoid refactoring unrelated code.
3. **No invented structure.** Do not create directories or modules that weren't requested and don't exist yet.
4. **Respect the license.** Any dependencies or code snippets introduced must be Apache 2.0-compatible.
5. **MusicXML parsing.** Prefer established libraries (`music21` in Python, `musicxml` npm package for Node.js) over hand-rolled XML parsing.
6. **Tests required.** Any functional logic added should have corresponding tests.
7. **Branch discipline.** Work on the designated `claude/` branch; never push directly to `master`.
8. **French README.** The project README is in French — keep it in French or discuss with the owner before changing the language.
9. **Output files.** Generated grids (PDF, SVG, HTML) should never be committed; add them to `.gitignore`.
10. **Ask before large refactors.** If structural changes (renaming modules, switching language/framework) seem necessary, confirm with the user first.

## Notes on Current State (as of 2026-02-28)

- The repository contains no source code — only `LICENSE` and `README.md`.
- There is one commit: `bee594b Initial commit`.
- No build system, test framework, or CI/CD configuration exists yet.
- The project intent (from the README) is: *"Construire Jazz grid generator à partir de fichiers .musicxml"* — Build a Jazz grid generator from .musicxml files.
- Technology stack has not been decided; Python is recommended given the music tooling ecosystem.
