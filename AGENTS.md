# GotujTo — AGENTS.md

## Purpose

This file defines mandatory rules for any coding agent working in this repository.

The repository is the GotujTo project. Follow these rules whenever you inspect, edit, test, generate files, or run commands.

## Security rules

- Never read, open, print, summarize, parse, inspect, copy, or otherwise access any `.env` file or any file matching `.env*`.
- Never attempt to discover secrets outside the repository.
- Never read files from `J:\Projekty\gotujto-secrets`.
- Never display or log environment variable values.
- Never display or log API keys, access tokens, passwords, credentials, cookies, private keys, session tokens, or authentication headers.
- It is acceptable to reference environment variables symbolically, for example:
  - `process.env.ADMIN_CONVEX_SECRET`
  - `process.env.NEXT_PUBLIC_CONVEX_URL`
- Never resolve or print the actual values of environment variables.
- If a task appears to require a secret, stop and ask the user to perform that step manually.
- Never copy secrets into source code, test fixtures, generated files, comments, documentation, prompts, or logs.
- Treat `.gitignore` as a repository rule, not as permission to inspect ignored files.

## Filesystem boundaries

- Work only inside this repository unless the user explicitly requests otherwise.
- Do not modify files outside the repository.
- Do not inspect:
  - `J:\Projekty\gotujto-secrets`
  - user profile credential stores
  - SSH keys
  - browser profiles
  - cloud credentials
  - OS credential stores
  - unrelated directories
- Do not follow symbolic links or junctions that lead outside the repository unless the user explicitly approves it.

## Production safety

- Never run production commands without explicit user approval in the current conversation.
- Never run `convex import --prod` automatically.
- Never run production deployments automatically.
- Never execute destructive database operations against production.
- Never delete, truncate, overwrite, or migrate production data without explicit user approval.
- Never run production migrations automatically.
- Never push directly to the main/default branch without explicit user approval.
- When a task affects production, prefer preparing the command for the user to review and run manually.

## Convex rules

- Convex schemas and validators are the source of truth for document shape.
- Before generating Convex import data, inspect the relevant schema.
- Do not invent fields that are not present in the schema.
- Preserve the exact expected types, including `null`, arrays, literals, IDs, and timestamps.
- JSON files intended for Convex CLI import must use the format expected by Convex.
- For JSON imports, use a top-level JSON array when required by the CLI.
- Never execute `--prod` imports unless the user explicitly asks for that exact action.

## Git rules

- Avoid unrelated edits.
- Review `git diff` before considering a change complete.
- Do not rewrite Git history unless explicitly requested.
- Do not commit secrets or generated credential files.
- Do not push changes unless explicitly requested.
- Prefer small, focused changes that are easy to review.

## Command safety

- Prefer read-only inspection before making changes.
- Do not install global packages unless explicitly requested.
- Do not modify lockfiles unless the task requires dependency changes.
- Do not run scripts from untrusted sources.
- Do not pipe remote scripts directly into a shell.
- Do not enable unrestricted network access unless the task requires it and the user approves it.
- Do not run destructive shell commands unless explicitly requested.

## Project structure

This is a monorepo. Important areas include:

- `apps/web`
- `apps/mobile`
- `packages/convex`

Before changing code, inspect the relevant package and its local conventions.

## Environment variables

Environment files are intentionally stored outside this repository.

Do not assume a local `.env.local` should exist inside the project.

The project may be started with environment variables loaded externally before the application process starts.

Do not recreate `.env.local` files inside the repository unless the user explicitly asks for that.

## Data and import conventions

- Preserve UTF-8 correctly, including Polish characters.
- Do not add unnecessary fields to generated JSON.
- Generated data must match the destination schema exactly.
- Do not analyze or transform unrelated data unless the task requires it.
- When source data is uncertain, do not invent values.
- Prefer `null` over fabricated data when the schema allows it.

## Scope discipline

- Make only the changes needed for the current task.
- Do not refactor unrelated code unless explicitly requested.
- Do not rename files, directories, database fields, or public APIs without a clear reason and user approval when the change is broad.
- Preserve existing project conventions unless the task explicitly changes them.

## Final checks

Before reporting a coding task as complete:

1. Review the changed files.
2. Review `git diff`.
3. Check for accidental secret exposure.
4. Check that no `.env*` file was created.
5. Run relevant tests or type checks when appropriate and safe.
6. Clearly report what changed and any commands that still require manual user approval.
