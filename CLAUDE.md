# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`@remotion/skills` is an internal package that serves two purposes:
1. **Background animation components** (`skills/src/backgrounds/`) — eight 1920×1080 animated soft-background compositions registered in Remotion Studio.
2. **AI skill documentation** (`skills/skills/remotion/`) — a structured set of markdown rules that teach AI assistants how to write correct Remotion code.

## Commands

All commands run from the `skills/` directory after installing dependencies:

```bash
cd skills
npm install
npm run dev          # Start Remotion Studio (preview all compositions)
```

Render a single frame to sanity-check layout without a full render:

```bash
npx remotion still Bg01-Pearl-Foundation --scale=0.25 --frame=30
```

TypeScript is checked via `tsc --noEmit` (no separate lint script exists).

## Architecture

### Entry points

- `skills/src/index.ts` — calls `registerRoot(RemotionRoot)`; this is the Remotion bundle entry.
- `skills/src/Root.tsx` — declares every `<Composition>` and groups backgrounds inside a `<Folder name="SoftBackgrounds">`. All background compositions are 1920×1080 at 30 fps. Other compositions (BarChart, Typewriter, WordHighlight) are registered at the top level.

### Background components (`skills/src/backgrounds/`)

Each `BgXX*.tsx` file exports a single React component that is fully self-contained: it imports only from `remotion`, `./Shared`, and `./palette`. The animation loop is driven by `useCurrentFrame()` — no state, no side effects. Shared SVG primitives (`Vignette`, `Grid`, `Hairline`, `SineCurve`) and the `fadeIn` helper live in `Shared.tsx`. Named color constants typed as `[R,G,B]` tuples live in `palette.ts`; use `rgba(COLOR, alpha)` or `rgb(COLOR)` helpers rather than raw strings.

### Skill documentation (`skills/skills/remotion/`)

- `SKILL.md` — top-level entry point summarising all Remotion patterns; references topic-specific rule files.
- `rules/*.md` — one file per topic (timing, sequencing, transitions, audio, captions, etc.). These are loaded by AI assistants on demand; keep them authoritative and self-contained.
- `rules/assets/*.tsx` — reference implementations embedded in the skill (bar chart, typewriter, word highlight). They are also registered as compositions in `Root.tsx` for live preview.

## Remotion conventions (critical)

**CSS transitions and Tailwind animation classes are forbidden** — they do not render correctly in Remotion's frame-by-frame renderer. All animation must go through `interpolate()` or `spring()` from `remotion`.

Always clamp `interpolate` output unless you explicitly want extrapolation:

```ts
interpolate(frame, [0, 60], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
  easing: Easing.bezier(0.16, 1, 0.3, 1),
});
```

Use `Easing.out` for enter animations, `Easing.in` for exit animations.

When multiple properties share the same timing, compute one normalised `progress` value (0→1) and derive all properties from it rather than duplicating the full `interpolate` call for each property.

Place static assets in `public/` and reference them with `staticFile()`. Use `<Img>`, `<Video>`, and `<Audio>` from `remotion`/`@remotion/media` — not bare `<img>`, `<video>`, or `<audio>` tags.

Use `type` (not `interface`) for composition props to ensure `defaultProps` type safety.
