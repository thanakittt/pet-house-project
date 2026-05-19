<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lessons Learned

Keep this section short. Add a new lesson only when it prevents a likely repeated mistake. If a new issue fits an existing rule, update that rule instead of adding a new entry.

## Rules

### Patching mixed-language files
- Use ASCII-only anchors when patching files with Thai text, mojibake, or mixed encodings.
- Avoid Thai labels, Thai comments, and rendered mojibake in `apply_patch` context.
- Anchor patches on component names, prop names, route strings, class names, or identifiers.

### PowerShell quoting and paths
- Use `Get-Content -LiteralPath '...'` for paths containing route groups, parentheses, or brackets.
- Quote `rg` paths containing parentheses or brackets.
- Wrap full `rg` regex patterns in single quotes when searching JSX props, quotes, pipes, or alternation.
- Keep fragile JSX searches simple, or split them into separate `rg` calls.

### Package scripts on Windows
- If `pnpm` is unavailable, try the equivalent `npm.cmd run <script>`.
- Prefer `npm.cmd run <script>` when PowerShell blocks `npm.ps1`.

### Next.js docs and build
- Do not guess local Next.js docs paths. Find them with `rg --files node_modules/next/dist/docs`.
- If `next build` fails with sandbox `Access is denied` under `node_modules/.pnpm/**/package.json`, retry the same build with escalation before changing imports.

### Browser verification
- Use `load` or `domcontentloaded` for in-app browser load checks unless `networkidle` support is confirmed.

### React hooks lint
- Do not call React state setters synchronously inside effect bodies.
- For responsive subscriptions, initialize state outside the effect or update state only inside subscription callbacks/user events.
