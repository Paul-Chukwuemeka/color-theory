# Hardening: bugs, palette quality, UX, export, a11y, layout

Follow-on plan for the color-theory app. Six phases, one commit each, plus a
sweep test. Constraints: vanilla JS, no build, no dependencies, UMD modules,
`ColorMath`'s public API may grow but existing exports stay.

## Phase 1 — Bugs

1. `monoExtras` deduplicates: candidates until `count` unique hexes, sweeping
   sizes 3..21 over light, dark and mid bases.
2. Hue survives round-trips: `state.hsl = {h,s,l}` floats; hex is derived;
   parse hex only on typed input, preset or suggestion.
3. `buildPalette` uses `partnerHue`; test enforces the 60° promise.
4. Ratios are truncated to 2 decimals everywhere (`formatRatio`).
5. Hex field commits only a full 6-digit hex, Enter, or blur.
6. `relativeLuminance` uses the corrected 0.04045 threshold.
7. Hue ring: HSL stops at 60° steps, handle radius in a CSS variable, handle
   at 60px.

## Phase 2 — Palette quality

8. `ensureContrast(fg,bg,min)`; `accentText` / `accent2Text` text-safe fills
   used by the contrast rows, `data-text` previews and exports.
9. Text-safe variants computed per mode against that mode's background.
10. `textMuted` role (mix text toward bg, then the type's floor); swatches,
    contrast list, exports; preview dimmed text uses `--pv-text-muted`.
11. Semantics shift hue when within 25° of the accent and keep their floor.
12. Analogous: accent-2 is the nearest, calmer neighbour; extras fan out
    beyond it, still ≥60° from the accent.
13. `pickReadable` picks the higher-scoring label; contrast rows note when
    the preferred white was rejected.

## Phase 3 — UX and app.js

14. One render per frame (`requestAnimationFrame` batcher).
15. App type only overwrites harmony/mode the user has not chosen.
16. URL sync (`?hex=&type=&harmony=&mode=&size=`) with validation.
17. Header toggle is labelled "Preview: Light / Dark".

## Phase 4 — Export

18. CSS export gains Tailwind v4 `@theme`, the three-block "both" CSS,
    JSON, and a Copy button on the export block.

## Phase 5 — Preview and accessibility

19. `aria-hidden` preview card plus an `.sr-only` summary.
20. General mock says Success / Warning / Error.
21. States row: hover, disabled, focus ring, error input, from roles.
22. Touch targets ≥24px (32px under 520px); 9–10px text raised to ≥11px.

## Phase 6 — Layout and cleanup

23. Sticky rail at 901px+; compact sticky swatch strip below 900px.
24. Remove unused/duplicated CSS and merge the bottom patch blocks.
25. Favicon, meta description, Open Graph tags; document `?v=` in README.
26. `package.json`, GitHub Action, LICENSE, README screenshot + "How the
    palette is built".

## Final check

Sweep every APP_TYPE × HARMONY × base colour (including `#808080`, very
light, very dark) × light/dark and report every failure: duplicate extras,
accent-2 <60° from accent, any text-safe role or label below its floor.
