# Skills — task → skill map (FruitSnacks)

Skills are installed **globally** (`~/.claude/skills/`), so they work in FruitSnacks without
living in this folder. This file is just the guide for which skill to reach for. They
auto-invoke by task match; you can also name one explicitly.

> Stack here = Express+TS+Mongoose backend · React 18+Vite admin · Next.js 14 frontend ·
> MongoDB. (So Payload / Postgres-specific skills don't apply — noted below.)

## Frontend / UI — heavy use in admin redesign + frontend 2.0
| Task | Skill |
|------|-------|
| Distinctive, production-grade UI (avoid generic AI look) | `frontend-design` |
| Landing/marketing/section redesign, anti-slop | `design-taste-frontend` |
| Styles, palettes, font pairings, layout, charts, UX rules | `ui-ux-pro-max` |
| Add/compose UI primitives (admin + storefront) | `shadcn` |
| Component inspiration / generation (MCP) | 21st.dev (`magic`) |

## Animation — premium motion for frontend 2.0
| Task | Skill |
|------|-------|
| Component animation, transitions, gestures, micro-interactions | `framer-motion-animator` |
| GSAP tweens, easing, stagger, reduced-motion | `gsap-core` |
| Scroll-linked animation, pinning, parallax | `gsap-scrolltrigger` |

## Next.js / React (frontend)
| Task | Skill |
|------|-------|
| App Router conventions, RSC, metadata, data patterns | `next-best-practices` |
| React/Next performance (memo, bundles, fetching) | `vercel-react-best-practices` |
| Caching / PPR / `use cache` | `next-cache-components` |
| Upgrade Next.js | `next-upgrade` |

## Data / tables (admin)
| Task | Skill |
|------|-------|
| Async/server state, data fetching, caching | `tanstack-query` (note: admin uses React Query already; frontend uses RTK Query) |
| Data grids / tables for admin lists | `tanstack-table` |

## SEO (storefront)
| Task | Skill |
|------|-------|
| Audit/diagnose SEO, technical SEO, metadata review | `seo-audit` |

## Debugging
| Task | Skill |
|------|-------|
| Any bug / test failure / unexpected behavior | `systematic-debugging` |

## Discovering / installing more skills
- **`find-skills`** (global) — meta-skill. When a capability might exist as a skill
  ("find a skill for X"), use it to search the ecosystem and install the best one.
- CLI: `npx skills find <query>` · `npx skills add <repo> --skill <name> --global --agent claude-code --copy`
  (run a 2nd time with `--agent cursor` to mirror to Cursor — the CLI takes one agent per run).

## Not applicable here
- `payload` — that's for the Payload/Postgres stack (AgencyPlatform), not FruitSnacks (Express/Mongoose).

## Conventions
- Use a skill **when its task actually comes up** — don't invoke speculatively.
- For UI work, lead with `frontend-design` / `ui-ux-pro-max`, compose with `shadcn`.
- Install a new skill only when a concrete need appears (keep the surface lean).
