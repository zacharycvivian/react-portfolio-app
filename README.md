This is [Zachary Vivian's website](https://www.zacharycvivian.com/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

This website was designed with both Desktop and Mobile applications in mind, allowing for a seamless user experience.
![PortfolioReadme]![GitHub](https://github.com/zacharycvivian/react-portfolio-app/assets/161660633/a6eae3c3-3707-42c2-be8f-dec429bafce4)

## Tools
Frameworks: React/Next.js/Tailwind CSS,
Database: Google Firebase,
AI Chatbot: Google Gemini,
UI Elements: Shadcn.ui (Sidebar, Dropdowns), Radix-ui (Icons),
Code Help: Claude by Anthropic,
Hosting: Domain from Squarespace & Hosted on Vercel,
Other Tools: Google Search Console (Sitemapping)

![frameworks](https://github.com/zacharycvivian/react-portfolio-app/assets/161660633/60eb1559-0687-4483-a4f3-1e3902e912ae)

## Note
This website and its contents are protected under United States Copyright Law (except artifical-intelligence generated images and text, Shadcn.ui elements, and Radix-ui icons; I do not claim those to be of my own work). You are welcome to use my code as a resource for inspiration, but direct plagiarism will NOT be tolerated. If you have suggestions for improvements or bug fixes, please log into my website and submit feedback/report bugs under your profile.

## Set Up
Before starting, you will need to create a .env file in your main folder linking your respective environment variables. (Make sure you don't upload these to your repo!)

## .env
```GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOURPRIVATEKEYHERE\n-----END PRIVATE KEY-----\n"

GOOGLE_APPLICATION_CREDENTIALS=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

> The `NEXT_PUBLIC_*` Firebase values are the client SDK config and are safe to
> ship to the browser. The un-prefixed `FIREBASE_*` and `GOOGLE_*` values are
> **server-only secrets** — keep them out of the repo and set them in Vercel for
> production.

## Install Packages (In Main Directory)
You will need to install all necessary packages before being able to run the application

```bash
npm install
```

## Getting Started
Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

| Command           | What it does |
| ----------------- | ------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Production build |
| `npm run start`   | Serve the production build |
| `npm run lint`    | Lint with ESLint (flat config — fails on any warning) |
| `ANALYZE=true npm run build` | Build with the [`@next/bundle-analyzer`](https://www.npmjs.com/package/@next/bundle-analyzer) report |

## Project structure

```
src/
├── app/                       # App Router routes (file-based routing)
│   ├── page.tsx               # Home — Server Component
│   ├── home/                  # Home's client islands: Chatbot, HomeCarousel,
│   │                          #   HeroText, HeroButtons, ResumeButton, Skills
│   ├── about/                 # About — Server Component (about.tsx) + page.tsx
│   ├── gallery/               # Photo gallery (client: Firestore + Storage)
│   ├── contact/               # Auth-gated contact form
│   ├── testimonials/          # Testimonials list + submission
│   ├── admin/                 # Admin dashboard — Server Component + Server Actions
│   ├── edit-profile/          # Profile editor
│   ├── cyberwordle/ snake/ pong/   # Browser games
│   ├── api/                   # Route handlers: auth, resume, image download
│   ├── robots.ts / sitemap.ts # SEO metadata routes
│   └── layout.tsx             # Root layout (providers, header, sidebar, footer)
├── components/
│   ├── motion/Animated.tsx    # Shared client motion wrappers (fade-in cards)
│   ├── ui/                    # shadcn/ui primitives (button, card, sheet, …)
│   └── Header.tsx / Sidebar.tsx / Footer.tsx / …
├── types/index.ts             # Shared TypeScript interfaces (see ARCHITECTURE.md)
└── lib/                       # Utilities (profanity filter, `cn` class helper)
firebase.ts                    # Firebase client SDK init (browser)
firebase-admin.ts              # Firebase Admin SDK init (server only)
auth.ts                        # NextAuth (Google OAuth) configuration
```

## Architecture

For the Server vs Client component strategy, the shared-types convention, and
how Firebase/auth are wired, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## Deployment
Deployed on **Vercel** — every push to `main` ships a production build. All
environment variables above must be configured in the Vercel project settings
(the `NEXT_PUBLIC_*` ones are required at build time).
