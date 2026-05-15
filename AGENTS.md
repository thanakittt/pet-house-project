<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Lessons Learned

## 1. Example
Problem:
- 

Cause:
- 

Solution:
- 

Rule for next sessions:
- 
- 

## 2. Patch context with mojibake Thai comments
Problem:
- `apply_patch` failed when matching context that included Thai comments rendered as mojibake.

Cause:
- The patch context used non-ASCII/comment text as anchors, but the file content was encoded or displayed differently.

Solution:
- Re-applied the patch using stable ASCII anchors such as `satisfies ChartConfig`, class names, and component tags.

Rule for next sessions:
- Prefer ASCII-only context anchors when patching files that show mojibake or mixed-language comments.
- Avoid relying on rendered Thai comment text as patch context unless the exact bytes are confirmed.

## 3. Missing pnpm command in PATH
Problem:
- `pnpm lint` failed because `pnpm` was not recognized in the current PowerShell session.

Cause:
- The package manager binary was not available on PATH, even though the project defines lint scripts.

Solution:
- Use `npm run lint` as a local fallback for the same package script when `pnpm` is unavailable.

Rule for next sessions:
- If `pnpm` is missing, verify with the equivalent `npm run <script>` before stopping verification.

## 4. npm.ps1 blocked by PowerShell execution policy
Problem:
- `npm run lint` failed because PowerShell blocked `npm.ps1` under the current execution policy.

Cause:
- PowerShell attempted to execute the script shim instead of the `.cmd` launcher.

Solution:
- Use `npm.cmd run lint` on Windows PowerShell to run the same npm script.

Rule for next sessions:
- Prefer `npm.cmd run <script>` when `npm` is blocked by PowerShell execution policy.

## 5. In-app browser waitForLoadState networkidle unsupported
Problem:
- Browser verification failed when using `waitForLoadState({ state: "networkidle" })`.

Cause:
- The in-app browser runtime for this session does not support the `networkidle` load state.

Solution:
- Retry browser verification with `waitForLoadState({ state: "load" })`.

Rule for next sessions:
- Use `load` or `domcontentloaded` for in-app browser verification unless `networkidle` support is confirmed.

## 6. PowerShell Select-String regex with quotes and pipes
Problem:
- `Select-String` failed when the regex pattern included quoted JSX attributes and `|` alternation.
- `rg` failed from PowerShell when a double-quoted regex included escaped JSX quotes and `|` alternation.

Cause:
- The PowerShell command string did not preserve the regex as one argument, so pieces of the pattern were parsed as separate positional parameters.

Solution:
- Use `rg -n 'pattern' ...` for JSX searches, or pass a safely quoted single pattern string to `Select-String`.
- Use single quotes around the full `rg` pattern in PowerShell, especially for JSX attributes and alternation.

Rule for next sessions:
- Prefer `rg` for multi-term JSX/TSX searches in PowerShell.
- If using `Select-String`, wrap the full pattern so PowerShell receives it as one argument.

## 7. Reusing mojibake context in patches
Problem:
- `apply_patch` failed while wrapping announcement date fields because the patch included Thai mojibake labels and validation text as expected context.

Cause:
- The file contains mixed-language mojibake, and patch matching is byte-sensitive.

Solution:
- Re-applied the change using ASCII-only JSX anchors such as `name="startDisplayAt"` and `name="isActive"`.

Rule for next sessions:
- When a file already shows mojibake, keep patch hunks minimal and anchor on ASCII identifiers only.

## 8. PowerShell paths with route-group parentheses
Problem:
- `Get-Content app\(back-office)\...` failed because PowerShell parsed the route-group parentheses instead of treating them as a path.

Cause:
- Unquoted paths with `(` and `)` are interpreted by PowerShell syntax before reaching the filesystem command.

Solution:
- Re-run the read with `Get-Content -LiteralPath 'app\(back-office)\...'`.

Rule for next sessions:
- Use `-LiteralPath` with quoted paths for Next.js route groups or any path containing parentheses/brackets.

## 9. Next build sandbox access denied for pnpm package files
Problem:
- `npm.cmd run build` failed because Turbopack could not read package files under `node_modules/.pnpm`, reporting `Access is denied`.

Cause:
- The sandbox blocked Next.js from reading some dependency package metadata during production build resolution.

Solution:
- Re-run the same build command with escalated permissions after the sandbox failure.

Rule for next sessions:
- If `next build` fails with `Access is denied` while reading `node_modules/.pnpm/**/package.json`, retry the build with escalation instead of changing package imports.

## 10. Guessing Next docs paths
Problem:
- `Get-Content` failed when reading a guessed Next.js docs path under `node_modules/next/dist/docs`.

Cause:
- The local Next.js package stores docs as `.md` files in a different directory layout than the guessed `.mdx` path.

Solution:
- Search the installed docs first with `rg --files node_modules/next/dist/docs` and then read the exact matching path.

Rule for next sessions:
- Do not guess Next.js docs paths. Find the real path with `rg --files` before using `Get-Content`.

## 11. React setState synchronously within effect
Problem:
- `npm.cmd run lint` failed with `react-hooks/set-state-in-effect` after adding a responsive `matchMedia` effect.

Cause:
- The effect called `setIsEditing(false)` directly in the effect body instead of only responding to external subscription changes.

Solution:
- Removed the immediate `setState` call and kept the state update inside the `matchMedia` change callback.

Rule for next sessions:
- Do not call React state setters synchronously inside an effect body. For responsive subscriptions, initialize state safely outside the effect or update state only inside subscription callbacks/user events.

## 12. Patching JSX with Thai aria-label context
Problem:
- `apply_patch` failed while removing `desktopOnly` from a JSX action link because the hunk included a Thai `aria-label`.

Cause:
- The patch context mixed rendered Thai text with stable JSX props, making the match fragile in files that may display differently across tools.

Solution:
- Re-applied the patch using ASCII-only JSX anchors: `action="manage"`, `desktopOnly`, and the `href` line.

Rule for next sessions:
- For JSX files with Thai labels, avoid including Thai `aria-label` text in patch context. Anchor on component names, prop names, route strings, or other ASCII identifiers.
