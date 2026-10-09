# Hexfield Studio — Build 295

The homepage is now a focused studio with **LANDSCAPE** and **LOGO & LETTERS** modes.

The homepage does **not** load `public/app.js`, `words/hexfield-visual.js`, any sketch library, or any hand-drawn reference material. New landscapes are drawn procedurally from terrain, atmosphere, light, colour and brushwork; logos use actual Canvas font glyphs and typography for readable wordmarks, monograms and emblems.

The earlier experimental studio remains available at `/legacy.html` and its historical source files, museum and records are preserved.

Modules: `public/studio/landscape.js`, `lettering.js`, `studio-controller.js`, `studio.css`. User feedback is saved locally immediately; authenticated anonymous Supabase sessions sync it to `hexfield_studio_votes`. Human votes for the two disciplines are kept separate from previous field/taste data. Shared learning results use `hexfield_studio_shared_taste` and only reveal aggregates with at least three contributing visitors. The artist favours choices that visitors have kept and explores less successful choices less often, but manual selectors always take precedence.

Keep/reject feedback affects subsequent **Surprise me** scene, mood and style selection. For fixed scene and mood, the painter explores different procedural compositions instead of changing the user's selected subject.

The gallery stores up to 12 kept recipe thumbnails on the current browser. Export produces a deterministic PNG (landscape/wordmark 2400×1480, monogram/emblem 1480×1480). No external image resources or third-party generator dependencies are required.

The Stripe and physical print purchase pipeline remains disabled in the new homepage until prices, supplier fulfillment and live-account credentials are verified. No Stripe functions or payment secrets were modified in this build.

## Testing

Validate module syntax with Node.js and run generator smoke tests for all six scenes, four lighting moods, five type styles and three logo formats. Browser painting and Supabase vote sync require end-to-end verification after deployment.

**Do not remove the legacy source files or the old museum database in this release.**
