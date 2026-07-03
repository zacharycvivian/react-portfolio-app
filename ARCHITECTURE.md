# Architecture

Notes on how this Next.js App Router project is organized, why pages are split
the way they are, and the conventions to follow when extending it.

## Server vs Client Components

Next.js App Router renders every component on the server by default. A component
only needs to become a **Client Component** (`"use client"` at the top of the
file) when it uses browser-only features: React state/effects, event handlers,
the DOM, `next-auth/react`'s `useSession`, Framer Motion, etc.

The goal is to keep **as much as possible on the server** so the markup arrives
as HTML on first paint (better FCP/LCP) and ships no JavaScript. We use the
"islands" pattern: a Server Component renders the static content directly and
drops small Client Components in only where interactivity is required.

### Home (`src/app/page.tsx`) — the reference example

`page.tsx` is a **Server Component**. The bio, work-experience timeline, senior
project, hobbies, and the technical-skills list are static, so they render to
HTML on the server. The interactive pieces live in `src/app/home/` and are the
only things that ship/​hydrate JavaScript:

| Island                 | Why it's a client component |
| ---------------------- | --------------------------- |
| `Chatbot.tsx`          | Terminal state + **lazy-loads the Firebase SDK** only when opened (`loadFirestoreDeps`) |
| `HomeCarousel.tsx`     | Embla carousel + autoplay (browser-only) |
| `HeroText.tsx`         | Time-of-day greeting + rolling specialty word (Framer spring; reduced-motion aware) |
| `HeroButtons.tsx`      | Contact button is auth-gated (`useSession` + `signIn`) |
| `ResumeButton.tsx`     | Resume download gated behind sign-in |
| `Skills.tsx`           | **Server** — static data, kept on the server on purpose |

Images are imported in the Server Component (so Next can generate blur
placeholders at build time) and passed into the islands as props.

### About (`src/app/about/about.tsx`)

A **Server Component**. All copy and the inline tech-stack SVGs render on the
server; only the scroll-in animation wrappers are client code.

### Admin (`src/app/admin/page.tsx`)

A **Server Component** that reads Firestore through the Admin SDK and mutates it
via **Server Actions** (`"use server"` functions). Authorization is centralized
in one `getAdminDoc()` helper that every action and the page loader call — it
resolves the requester's `users` doc (by NextAuth id, then email) and returns
`null` unless `isAdmin` is set.

## Liquid-glass design system

The visual theme is a "liquid glass" treatment (translucent refractive panes,
à la iOS 26) built from three layers:

1. **Design tokens — `src/app/globals.css`.** Every glass surface consumes
   shared custom properties instead of hand-rolling styles:
   - `--glass-filter` / `--glass-filter-button` / `--glass-filter-popover` /
     `--glass-filter-bar` — the backdrop recipes (blur + saturate fallback).
   - `--glass-shadow-panel|button|popover|modal|pressed` (+hover variants) —
     shadow stacks composed from `--glass-edge` (chromatic-dispersion fringe,
     cool specular bevel, dark counter-bevel).
   - Motion tokens: `--ease-glass` (standard), `--ease-gel` (overshooting
     droplet spring, transforms only), `--dur-fast/med/gel`.
   When adding a new surface, use these tokens — do not write bespoke
   backdrop-filter/box-shadow stacks.

2. **Refraction lens — `src/components/LiquidGlassDefs.tsx`.** Real liquid
   glass refracts: the backdrop bends around each pane's edges with chromatic
   aberration (R/G/B displaced by slightly different amounts). This is an SVG
   filter (`#glass-lens`) whose displacement map is generated on a canvas at
   runtime. Only Chromium supports SVG filters inside `backdrop-filter`, so the
   component feature-detects the engine and sets `data-liquid-glass="on"` on
   `<html>`; `globals.css` then swaps the `--glass-filter*` recipes over to the
   lens. Safari/Firefox silently keep the frosted fallback. It also respects
   `prefers-reduced-transparency`.

3. **Reactive light — `src/components/ReactivityProvider.tsx`.** An opt-in
   (theme dropdown → "Reactivity") pointer/tilt-driven light model: it
   discovers glass surfaces at runtime, injects a `.reactive-sheen` overlay
   into each, and drives per-pane rim light, a travelling specular glint,
   prismatic fringes, and a subtle parallax tilt from one shared light source.
   The rAF loop early-outs on settled frames, so an idle page costs almost
   nothing.

Text animations follow the same restraint: the header title "decodes" in place
(constant width, `aria-hidden` glyphs + an `sr-only` static name) and the hero
skill words roll vertically — both skip themselves under
`prefers-reduced-motion` and pause in hidden tabs.

## Shared motion wrappers — `src/components/motion/Animated.tsx`

The site's scroll-in card animation is the one bit of client code the otherwise
static pages need. It's isolated into `AnimatedCard` / `AnimatedDiv` /
`AnimatedTitle` / `AnimatedGroupHeader`. A Server Component can render these
directly; the animated `children` are still server-rendered and passed through.
Reuse these instead of importing `framer-motion` ad hoc.

## Shared types — `src/types/index.ts`

All cross-cutting domain types live here (`Photo`, `PhotoComment`,
`PhotoMetadata`, `NotifItem`, `NotificationType`, `SessionUser`,
`FirestoreTimestamp`). Import from `@/types` rather than redeclaring local
`interface`s, and avoid `any` for Firestore data — use `FirestoreTimestamp`,
`DocumentData`, and `QuerySnapshot`/`QueryDocumentSnapshot` from
`firebase/firestore`.

## Firebase: client SDK vs Admin SDK

- **`firebase.ts`** — client SDK (Firestore, Storage, Gemini AI). Used inside
  Client Components and the browser. Configured from `NEXT_PUBLIC_FIREBASE_*`.
- **`firebase-admin.ts`** — Admin SDK with service-account credentials
  (`FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`).
  Server-only; used by Server Components, Server Actions, and `auth.ts`. Never
  import this into a Client Component.

## Authentication & admin flow

- **`auth.ts`** configures NextAuth with Google OAuth and the Firestore adapter.
  The `signIn` callback links each Google account to a single `users` doc; the
  `session`/`jwt` callbacks attach the Firestore user id (and a Firebase custom
  token) to the session.
- `session.user.id` (typed via `SessionUser`) is the Firestore `users` doc id.
- Admin status is the `isAdmin` boolean on that `users` doc. Client-side checks
  (e.g. the Header notifications panel) read it via the client SDK; server-side
  checks use `getAdminDoc()` in the admin route.

## Linting

ESLint uses **flat config** (`eslint.config.mjs`), spreading the native
`eslint-config-next` core-web-vitals + typescript arrays. The project is pinned
to ESLint 9 because `eslint-config-next@16`'s bundled `eslint-plugin-react` is
not yet compatible with ESLint 10. `npm run lint` fails on any warning.

## Conventions checklist for new work

1. Default to a Server Component. Add `"use client"` only when you need browser
   APIs, hooks, or event handlers.
2. Put interactive bits in small islands; keep static content on the server.
3. Import domain types from `@/types`; don't reintroduce `any` for Firestore.
4. Reuse the `@/components/motion/Animated` wrappers for scroll-in animations.
5. Keep Admin-SDK / secret code out of Client Components.
6. Run `npm run lint` and `npx tsc --noEmit` before committing.
