<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:local-command-rules -->
## Local Command Rules

- Do not use `pnpm` directly in this environment; it may not be available in PATH.
- When running TypeScript checks, use:
  - `npm.cmd exec tsc -- --noEmit` 
- Do not use `npm exec ...` through PowerShell because `npm.ps1` may be blocked by the execution policy.
- Prefer `npm.cmd ...` over `npm ...` for npm commands in PowerShell.
- Git commands that modify `.git` state, such as creating branches, staging, or committing, may require elevated permission.
  - If `git switch -c`, `git add`, or `git commit` fails with `.git/*.lock` permission errors, rerun the same command with elevated permission.
- Do not rely on `Get-NetTCPConnection`; the `NetTCPIP` module may fail to load.
- Use `netstat -ano | findstr ":<port>"` to check whether a port is already in use.
<!-- END:local-command-rules -->
