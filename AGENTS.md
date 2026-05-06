<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Beginner-Friendly Development Rules

## Primary Goal

Write code for:
1. readability
2. maintainability
3. beginner understanding
4. learning-oriented explanations

Do NOT optimize for:
- clever code
- shortest possible code
- advanced abstractions
- over-engineering

Assume the developer reading the code is beginner/intermediate.

---

# Definition of Done

A task is considered complete when:

- the code works correctly
- TypeScript passes
- changed files pass lint checks
- no obvious regressions are introduced
- code is readable for beginner/intermediate developers
- important logic includes helpful inline comments
- unnecessary complexity is avoided

---

# Code Style Rules

Prefer:
- simple logic
- explicit naming
- step-by-step code
- readable control flow
- predictable patterns

Avoid:
- nested ternary operators
- deep abstractions
- unnecessary reusable utilities
- advanced functional programming
- one-liners that hurt readability
- overuse of generics
- magic behavior hidden inside helpers

---

# Teaching Mode

The goal is NOT only to complete the task.

The goal is also to help the developer learn.

When generating code:
- explain important logic
- explain WHY the code exists
- explain the data flow
- explain beginner mistakes to avoid
- use beginner-friendly language

---

# Data Flow Rules

When explaining or reviewing code:
- explain where data comes from
- explain how data changes
- explain where data is validated
- explain where side effects happen

---

# Inline Comments

Add inline comments for:
- business logic
- validation
- tricky conditions
- database operations
- important UI behavior

Do not add comments that only repeat the code.

---

# Function Rules

Prefer:
- small functions
- single responsibility
- readable parameters
- explicit returns

Avoid:
- giant functions
- hidden side effects
- unnecessary abstraction

---

# Naming Rules

Use descriptive names.

Prefer:
- isLoading
- selectedCustomer
- formattedPrice
- appointmentDate

Avoid:
- data
- item
- temp
- value2
- x

---

# TypeScript Rules

Prefer simple and readable TypeScript.

Avoid advanced TypeScript unless truly necessary:
- complex generics
- conditional types
- deeply nested utility types

Prefer:
- simple interfaces
- readable types
- explicit types when helpful

---

# React / Next.js Rules

Prefer:
- readable JSX
- logic above return
- small components
- clear component responsibilities

Avoid:
- deeply nested JSX
- large inline logic inside JSX
- massive page components

When possible:
- move complex logic into helper functions
- keep UI components focused on rendering

---

# Server Action Rules

Prefer:
- consistent ActionResponse patterns
- explicit error handling
- validation before database operations
- early returns for invalid input

Avoid:
- hidden thrown errors for expected failures
- inconsistent response shapes

---

# Refactoring Rules

Do not over-engineer.

Prefer duplication over premature abstraction.

Before creating abstractions:
- first prefer explicit code
- only abstract after repeated real usage
- avoid creating utilities for hypothetical future reuse

Only create reusable utilities/components when:
- logic is repeated multiple times
- abstraction clearly improves readability
- abstraction reduces maintenance cost

---

# Bug Fix Rules

When fixing bugs:
1. explain the root cause simply
2. explain why the fix works
3. explain how to avoid the issue next time

Do not assume expert-level knowledge.

---

# Architecture Rules

Prefer:
- simple folder structure
- predictable naming
- feature-based organization
- low cognitive load

Avoid architecture patterns that are difficult for beginners to understand.

---

# Testing Rules

When changing logic:
- verify the affected flow works correctly
- update existing tests when needed
- avoid breaking existing behavior
- prefer small focused validation over massive test rewrites

If tests cannot be run:
- clearly explain why
- explain what was verified manually

---

# Review Rules

When reviewing code:
- prioritize correctness first
- prioritize readability second
- prioritize optimization last

Use severity levels:
- Critical
- Major
- Minor
- Quick win

Verify findings against the current code before suggesting fixes.

---

# Project Structure Notes

Prefer:
- feature-based organization
- predictable file locations
- colocated components/actions/types when reasonable
- readable import paths

Avoid:
- deeply coupled modules
- unclear shared utilities
- large folders with mixed responsibilities

---

# Validation Workflow

Before finishing a task:
1. verify the requested behavior works
2. run relevant validation commands when possible
3. review for readability and beginner friendliness
4. check for obvious regressions
5. confirm unnecessary complexity was not introduced
