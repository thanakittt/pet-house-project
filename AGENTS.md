<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes: APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Beginner-Friendly Code Rules

- This project is maintained by a beginner-to-intermediate developer.
- Prioritize readability and maintainability over clever or highly abstract code.
- Avoid unnecessary advanced patterns unless clearly justified.
- Prefer explicit and verbose code over compact one-liners.
- Keep functions small and focused.
- Avoid over-engineering.

### Code Explanation Requirements

When generating or modifying code:

- Add inline comments for important logic.
- Explain the purpose of each major block.
- Explain data flow step-by-step:
  - input
  - processing
  - output
- Explain why a solution is implemented this way.
- When using libraries/framework features, briefly explain them in beginner-friendly language.

### Architecture & Patterns

- Prefer simple architecture patterns.
- Avoid premature abstraction.
- Avoid deeply nested generic utilities unless necessary.
- Prefer duplication over difficult abstractions when readability would suffer.
- Reusable components/utilities should remain easy to understand.

### Teaching-Oriented Responses

When possible:

- Teach alongside implementation.
- Break complex logic into smaller steps.
- Mention common beginner mistakes.
- Suggest simpler alternatives if the generated solution is advanced.

### Refactoring Rules

- Do not aggressively refactor working code into highly abstract patterns.
- Preserve readability during refactors.
- Minimize cognitive load for future maintainers.

### Output Style

- Use clear naming.
- Avoid unnecessary shorthand syntax.
- Prefer beginner-friendly TypeScript patterns.
- Avoid combining too many concepts in a single block of code.