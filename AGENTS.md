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

Cause:
- The PowerShell command string did not preserve the regex as one argument, so pieces of the pattern were parsed as separate positional parameters.

Solution:
- Use `rg -n 'pattern' ...` for JSX searches, or pass a safely quoted single pattern string to `Select-String`.

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
