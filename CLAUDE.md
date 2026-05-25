# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

All code lives inside the nested `skills/` directory — there is no top-level package. When running commands, `cd skills/` first (or run from that directory). The repo contains three things:

- `skills/src/` — Remotion compositions (the actual video source). `src/index.ts` calls `registerRoot(RemotionRoot)`; `src/Root.tsx` is the composition registry.
- `skills/skills/remotion/` — A self-contained Remotion best-practices skill. `SKILL.md` is the entry point; `rules/*.md` are focused topic files (timing, transitions, audio, captions, tailwind, three.js, etc.) loaded on demand.
- `skills/previews/` — Rendered preview artifacts (`bg01.mp4`, `bg01.png`, …) and standalone HTML viewers (`backgrounds.html`, `socpa_treatment.html`). These are committed outputs, not source.

The package name is `@remotion/skills` (private, version-pinned to Remotion 4.0.x). It is a mirror of `remotion-dev/remotion/packages/skills` adapted for standalone use.

## Commands

Run from `skills/`:

- `npm run dev` — alias for `remotion studio`. Opens the Studio in a browser to preview compositions.
- `npx remotion studio` — same thing, works without install.
- `npx remotion still <composition-id> --scale=0.25 --frame=30` — one-frame render check (useful for sanity-checking new backgrounds without recording a full video).
- `npx remotion render <composition-id> out.mp4` — full render. Existing preview MP4s in `previews/` were produced this way.

There is no test runner, linter, or build step configured. `tsconfig.json` has `noEmit: true` — TypeScript is for type-checking only, not output.

## Architecture

### Composition registry (`src/Root.tsx`)

Every composition rendered by this project is declared here as a `<Composition>` child of `RemotionRoot`. Backgrounds are grouped under a `<Folder name="SoftBackgrounds">` so they appear nested in Studio. Standard dimensions for backgrounds: **1920×1080 @ 30 fps**. Adding a new composition requires both a component file and an entry in `Root.tsx` — the Studio sidebar only shows what's registered here.

### Background composition pattern (`src/backgrounds/`)

The eight `Bg0*.tsx` files all follow the same recipe:

1. Use `useCurrentFrame()` + `useVideoConfig()` to derive time `t = (frame / fps) * 2π`.
2. Drive slow `Math.sin`-based `drift` and `breathe` values that modulate gradient position/size.
3. Render a single `<AbsoluteFill>` whose `background` is a stack of layered `radial-gradient(...)` strings joined with `, `.
4. Overlay shared SVG primitives from `Shared.tsx` — `<Vignette>`, `<Grid>`, `<Hairline>`, `<SineCurve>` — for texture.
5. Wrap entry in `fadeIn(frame)` (linear ramp helper in `Shared.tsx`).

Colors come exclusively from `palette.ts` (named `Color` tuples like `PEARL`, `CHAMPAGNE`, `DUSTGOLD`) via the `rgb()` / `rgba()` helpers. Do not hard-code hex or rgb strings in background components — extend `palette.ts` if a new tone is needed.

### Skill files as authority

When changing or adding Remotion code, treat `skills/skills/remotion/SKILL.md` and the `rules/` files it links to as the source of truth for idioms (sequencing, easing, captions, fonts, etc.). The `rules/assets/*.tsx` files (e.g. `text-animations-typewriter.tsx`) are reference implementations — `Root.tsx` imports a few of them directly as live compositions, so renaming them breaks the registry.

## Conventions (non-obvious)

- **No CSS animations, no Tailwind animation classes.** Remotion captures discrete frames; only `useCurrentFrame()`-driven values render correctly. This is reiterated in `SKILL.md` and applies to everything in `src/`.
- **Assets are referenced via `staticFile()`** from a `public/` folder at project root — there is no `public/` here yet because current compositions are pure code/SVG. Add one if you introduce image/video/audio assets rather than committing to `previews/` (which is for output artifacts).
- **Indentation is tabs**, single quotes, no trailing semicolons-after-JSX-closing — match the existing `.tsx` style.
- **Preview artifacts are committed.** When meaningfully changing a background, regenerate its `bg0N.mp4` / `bg0N.png` in `previews/` so the HTML viewer (`previews/backgrounds.html`) stays in sync. Don't churn these on trivial edits.
