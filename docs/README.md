# Docs Site

This directory contains the Next.js and Fumadocs site for the distributed quantum services project.
It holds the public-facing guides, architecture material, reference docs, research notes, and contributor documentation.

For the workspace overview, see [`../README.md`](../README.md).

## Stack

- Next.js 16
- Fumadocs
- MDX content under `content/docs`
- optional OpenRouter-backed AI chat for doc search assistance

## Run Locally

The commands below use `npm`, but the site can also be managed with Bun if that is your preferred local workflow.

```bash
npm install
npm run dev
```

Default local URL:

- `http://127.0.0.1:3000`

Useful scripts:

```bash
npm run build
npm run start
npm run types:check
```

## Site Structure

- `content/docs/`: MDX content and section `meta.json` files
- `app/(home)/`: landing page
- `app/docs/`: docs shell and routed content pages
- `app/api/search/route.ts`: built-in docs search endpoint
- `app/api/chat/route.ts`: optional AI assistant route
- `lib/source.ts`: Fumadocs source loader and helpers
- `source.config.ts`: MDX collection configuration

## AI Search

The docs site includes an optional AI route backed by OpenRouter.

Environment variables:

- `OPENROUTER_API_KEY`: required to enable the AI chat route
- `OPENROUTER_MODEL`: optional model override

Behavior:

- if `OPENROUTER_API_KEY` is missing, the route returns `503`
- the non-AI docs experience still works normally
- the regular search endpoint remains available either way

## Authoring Notes

- Add new pages under `content/docs/`.
- Keep the relevant `meta.json` files updated so navigation stays correct.
- `fumadocs-mdx` generation runs during `postinstall` and `types:check`.
- The site also exposes `llms.txt` and `llms-full.txt` routes for machine-readable documentation exports.

## Content Areas

The current docs content is organized around:

- getting started
- core concepts
- reference
- research
- contributing

If you are updating system behavior, the docs site is where the user-facing explanation should usually live after the code change lands.
