# Hexfield 333 — RESEED, don't configure fonts

## Why this change

The user reported the new type was unattractive and BUBBLE wasn't visibly working. Simply adding further font parameters would compound the problem. Build 333 removes the dedicated LETTER SHAPE selector, renames the main CHANGE STYLE gesture to **↻ RESEED / ART + TYPE**, and makes each click choose an actually different executable painting family, one of six letter construction grammars, a freshly derived deterministic seed, and a bounded evolutionary layout variation for graphic purposes.

The six actual letter grammars are **bubble, block, rounded, architectural, kinetic, split**, crossed with five paint styles; the simple cycle visits all **30 art/type combinations** without asking the user to configure individual components. In continuous AUTO painting, near-parent bubble and block candidates still compete inside the existing fixed preview/full-render budget. REPEAT STYLE deliberately keeps the seed/grammar exact.

## Fix the font instead of tweaking the UI

1. BUBBLE uses a 700-weight system font as an underlying skeleton, inflates each letter through a real rounded outline, and keeps more spacious counters. BLOCK continues to draw a heavyweight 900 face with angular/mitered outlines. These different drawing operations lead to physically different pixel masks.
2. Chromatic word fills now use a **coherent accent hue**, rather than switching to another pigment every 8–10px inside a letter. The actual pixel ink still flips between high-contrast light and dark variants in response to the background.
3. Every full-resolution glyph has a reference skeleton rendered into an internal throwaway buffer at precisely the same coordinates. A bounded, in-process topology audit samples actual text-mask pixels for shape survival, inner enclosed voids (counters), and whitespace between adjacent characters. It is **not OCR** or a guarantee of semantic readability.
4. If an excessive mutation destroys the reference shape or counter, restore affected lettering locally toward the valid skeleton, preserving some contour expression. Successful mutated letters are left untouched. A second guard protects readability after source-edge/letter geometry coupling.
5. The final candidate selector cannot trade away seriously damaged lettering for a tiny overall aesthetic novelty gain when an alternative fully rendered candidate is close in W/φ/H quality. Strict golden-quality qualification and substantial composition differences remain authoritative. This never adds another full-size render.

## Single canvas and repeatability

The pre-letter art source is still kept separately from visible text (Build 332). Reseeding never paints into an already-lettered intermediate image. A single live canvas remains the output. The whole art/type/purpose choice and deterministic seed live in the accepted recipe; reseed ordinal is retained for a reproducible ordering.

## Verification

Automated raster tests exercise bubble/block differences, damaged synthetic O counters, merged character gaps and conservative repair, final readability arbitration, and all 30 one-click art/type pairings. Previous tests are updated for the new no-font-parameter UI and valid 700-weight font syntax.
