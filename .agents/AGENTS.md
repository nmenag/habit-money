# Habit Money — Workspace Agent Rules

## Release Notes (Notas de la versión)

When asked to write or generate release notes ("Notas de la versión"), always produce them using **exactly** the following format, one block per locale:

```
<es-419>
Ingresa o pega aquí las notas de la versión para el idioma "es-419".
</es-419>
<en-US>
Ingresa o pega aquí las notas de la versión para el idioma "en-US".
</en-US>
```

- Replace the placeholder text inside each tag with the actual release notes for that locale.
- Always include both `es-419` (Latin American Spanish) and `en-US` (English) blocks.
- Keep the notes concise, user-facing, and focused on what changed or improved from the user's perspective.
- Do **not** include technical jargon, internal ticket numbers, or developer-facing details.

## Code Formatting (Prettier)

After **every** file edit or creation, agents **must** run Prettier on the modified files before finishing the task.

**Command to format specific files** (preferred — targets only what was changed):

```bash
node_modules/.bin/prettier --write <file1> [file2 ...]
```

**Command to format all source files** (use after bulk changes):

```bash
node_modules/.bin/prettier --write "**/*.{ts,tsx,js,jsx,json}" --ignore-path .gitignore
```

### Rules

- Run Prettier **on every file you create or modify**, without exception.
- Always use the project's `.prettierrc` config (it is picked up automatically).
- Format **after** all code edits are complete, not between intermediate edits to the same file.
- If `node_modules/.bin/prettier` is not available (e.g. fresh clone), skip formatting and add a note to the user to run `npm install` first.
- Never alter `.prettierrc` or formatting configuration unless explicitly asked.
