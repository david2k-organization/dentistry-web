# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Frontend SPA for a dental clinic management system. React 19 + TypeScript + Vite, talking to a separate NestJS backend (not in this repo) documented under `docs/api/`. All user-facing copy is in **Vietnamese** — match that when adding UI text.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml`).

- `pnpm dev` — start the Vite dev server on **port 3000**
- `pnpm build` — typecheck (`tsc -b`) then production build; run this to verify types across the whole project
- `pnpm lint` — ESLint
- `npx tsc -b` — typecheck only (faster than a full build when checking a change)

There is **no test runner** configured. "Verifying" a change means `pnpm build` (types) + `pnpm lint`.

## Environment

- `VITE_API_URL` (in `.env.development`) points at the backend, e.g. `http://localhost:5000/api/v1`. The axios client falls back to `/api` if unset. Backend paths in code are relative to this base (e.g. `api.get("/patient")`).

## Architecture

### Backend contract
- All API calls go through the shared axios instance in `src/lib/api.ts`. A request interceptor attaches the JWT `Bearer` token; a response interceptor catches `401`, clears tokens, and redirects to `/login`.
- Every successful response is wrapped in an envelope: `ApiEnvelope<T> = { success, statusCode, message, data, ... }`. API functions return `res.data.data` (the unwrapped payload).
- Errors are `AxiosError`. Read the server message via `err.response?.data?.message` with a Vietnamese fallback string.
- **`docs/api/*.md` is the source of truth** for endpoints, DTO validation, envelopes, and known backend quirks. Read the relevant doc before wiring a feature. Quirks matter: e.g. `PUT /patient/:id` does not persist and returns a placeholder, so `updatePatient` returns `void` and the caller merges data into local state manually — whereas `PUT /service-categories/:id` returns the real updated object.

### Routing (TanStack Router, file-based)
- Routes live in `src/routes/`. `routeTree.gen.ts` is **auto-generated** by the `@tanstack/router-plugin` on dev/build — never edit it by hand; it regenerates when you add/change a route file.
- `_authenticated.tsx` is a layout route whose `beforeLoad` guard redirects to `/login` when `isAuthenticated()` is false. Authenticated pages go under `src/routes/_authenticated/`.
- `(auth)/` is a pathless group for public routes like login.
- Route files stay thin: they just wire a URL to a feature page component.

### Auth
- JWT `accessToken` + `refreshToken` stored in `localStorage` (`src/features/auth/auth-storage.ts`). `isAuthenticated()` = presence of an access token. There is no refresh-token rotation implemented client-side yet.

### Feature module pattern
Each domain lives in `src/features/<feature>/` and follows a consistent file layout (see `patients/` and `service-categories/` as the reference implementations):
- `types.ts` — entity + `Create*Input` / `Update*Input` types
- `api.ts` — CRUD functions over the shared `api` client
- `columns.tsx` — TanStack Table column defs, including row action buttons
- `<Feature>Table.tsx` — table wrapper (loading / empty / rows states)
- `<Feature>FormDialog.tsx` — one dialog handling **both create and edit**, validated with react-hook-form + zod; presence of the entity prop switches to edit mode
- `Delete<Feature>Dialog.tsx` — confirm-delete AlertDialog
- `<Feature>Page.tsx` — owns list state and orchestrates the dialogs; updates local state optimistically after save/delete rather than refetching

### Adding a new CRUD feature (checklist)
1. Create the `src/features/<feature>/` files following the pattern above.
2. Add `src/routes/_authenticated/<feature>/index.tsx` pointing at the page component.
3. Add a nav entry to `navItems` in `src/components/layout/app-sidebar.tsx`.

### UI layer
- shadcn/ui components (`style: radix-nova`, Radix primitives, lucide icons) live in `src/components/ui/` — added via the shadcn CLI, configured in `components.json`. Prefer reusing these primitives over hand-rolling.
- Tailwind CSS v4 (via `@tailwindcss/vite`), configured in `src/index.css` (no `tailwind.config`); theme uses CSS variables.
- `cn()` from `src/lib/utils.ts` for conditional class merging.
- Toasts via `sonner` (`<Toaster>` mounted in `__root.tsx`).

## Conventions

- `@/` aliases `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).
- `verbatimModuleSyntax` is on — use `import type { ... }` for type-only imports.
- Forms: react-hook-form + `zodResolver`. **Zod is v4** — do not use v3-only options like `{ invalid_type_error }`; pass error messages as string args to validators. Coerced fields (`z.coerce.number()`) have `unknown` input type, so coerce again (`Number(...)`) when building the API payload.
- `noUnusedLocals` / `noUnusedParameters` are enforced — unused symbols fail the build.
- ESLint runs the React Compiler/react-hooks rules; `useForm().watch()` and `useReactTable()` emit `react-hooks/incompatible-library` **warnings** by design (present in existing features) — warnings are acceptable, errors are not.
