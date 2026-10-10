# Hexfield 335 — Replace the font generator, do not keep warping fonts

The user was not satisfied with the previous fonts. Builds 330–334 attempted to create character through distortions, rounding masks and readability repair, but the result still looked wrong. The core problem: **stock font glyphs were repeatedly stroked, sheared, thresholded, repaired, and painted**, so the output had no coherent letter-drawing design.

Build 335 replaces the raster-warp source itself with a **deliberately constructed scalable Latin display alphabet**.

## The new construction

- There are real centreline/path plans for A–Z, 0–9 and common punctuation, consisting of deliberate open and closed strokes, quadratic and cubic curves. **No arbitrary horizontal slicing of a system font**.
- **Bubble** is a wide, round-ended stroke with open counters and an independently drawn inner core. It is an outlined vessel whose fill and rim are painted by the same final compositor.
- **Block** is a squarer, sharp-joined structural alphabet with flatter filled terminals, without a fake bubble rim.
- Each reseed changes a small number of bounded proportions per glyph (advance, slope, inherited anatomy, thickness), while preserving the path centreline and critical negative space. The same saved type genome reproduces the same word exactly.
- Other legacy construction grammars reuse the new hand-built alphabet with controlled stroke weight, weight distribution and slant; they no longer run the destructive old raster distortions.
- Unsupported characters use ordinary reliable system text as a per-character fallback so words are never silently dropped. The original text string remains unchanged in metadata.
- Main canvas interaction, user-supplied wording, promotion hierarchy, chromatic materials and typography scoring still run through the same **one** paint-and-type compositor; the change is strictly the glyph source. There are no new user-facing controls.

The change is not the claim that the result is automatically beautiful. It is a foundation on which visible character forms can be designed and judged, rather than growing a collection of filters on unrelated system fonts.

## Verification

The tests check path coverage, open O counters, reproducible vector pixels, real differences between bubble and block stroke construction, reliable fallback for non-Latin characters and identical final paint-and-ink results from identical seed and background. The previous inherited type-genome regression now asserts vector construction instead of broken row-mutation plumbing.
