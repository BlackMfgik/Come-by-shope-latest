# Claude Code Project Guidelines

## Build and Debug Commands

- **Install Dependencies:** `npm install`
- **Development Server:** `npm run dev`
- **Full Build (Check for errors):** `npm run build`
- **Linting:** `npm run lint`
- **Fix Linting:** `npm run lint -- --fix`
- **Type Checking:** `npx tsc --noEmit`

## Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router)
- **Library:** React 19 (Server Components by default)
- **State Management:** Zustand
- **Styling:** Tailwind CSS (Mobile-first approach)
- **Language:** TypeScript (Strict mode)

## Coding Rules

- **Components:** Use functional components. Always prefer Server Components unless interactivity/hooks are required (add `"use client"` only then).
- **State:** Use Zustand stores for global state. Keep stores in `@/store/` or `@/lib/store/`.
- **Styling:** Use utility classes only (Tailwind). Avoid custom CSS files unless absolutely necessary.
- **Imports:** Use the `@/` alias for all internal paths.
- **Error Fixing:** If a build fails, analyze the error trace, locate the file, and fix the types or logic. Do not ignore TypeScript errors with `@ts-ignore`.
- **UI:** Ensure all components are responsive and follow the Tailwind mobile-first convention.

## Automation Flow

- When asked to "check if it works", first run `npm run build`.
- If the build fails, fix the reported errors and re-run `npm run build`.
- Finally, run `npm run lint` to ensure code quality.
