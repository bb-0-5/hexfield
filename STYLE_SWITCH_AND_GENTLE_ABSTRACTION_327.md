# Hexfield Build 327 — Change Style, Repeat Style, Less Abstraction

## The user problem addressed

The continuous generator had gradually converged on its *hybrid* mark language and destructive recursive abstraction. Changing a rule often did not produce a clearly identifiable alternative style because the next hybrid pass mixed many mark procedures, reworked the parent into large masses and merged several source renderers. The user should not have to understand any of those implementation details to make a distinctive, recognizable output.

## First-class controls, directly below the one canvas

- **↻ CHANGE STYLE**: Render the SAME frozen original source and SAME fixed seed in the next genuinely different procedural painting style. The five modes are: **Ink Drawing** (hatching and density), **Pointillist** (discrete dots), **Cut Paper** (straight-sided cutouts and discrete tones), **Engraved** (carved light and shadow), and **Gestural** (executed invented compound marks and expressive pigments). They are separate executable rule/mark/rework configurations, never five prompts that secretly execute the same hybrid. Repeated clicks cycle these five styles.
- **REPEAT STYLE**: Re-execute the current configuration using the same unmodified source, same seed and same word content. This produces an identical result at pixel level. The style and hexadecimal seed are shown openly, so users can identify which exact visual method produced a painting.
- **ABSTRACTION — LOW / MEDIUM / HIGH**: LOW, now the UI default, retains a single recognizable photographic/imagined/reality anchor instead of recompositing a collage of all independent renderers. It turns off destructive coarse-mass reabstraction, perspective misreading and aggressive frame derivation, skips intrusive motif overlays and retains only a faint stable object. MEDIUM reintroduces spatial mixing and modest derivation without coarse-mass reduction. HIGH permits full recursive abstraction and the selected procedural style's most radical rework.
- Changing the abstraction level rerenders the selected style immediately from the *original anchored reference*, not the already-mutilated output.
- CHANGE STYLE and REPEAT STYLE paint with the **actual progressive rule engine** while the user watches. They never play a retrospective imitation of brushwork and never call a paid external image model.
- Selecting a different source or uploading a new reference invalidates the old repeat comparison. The current style/abstraction choice is stored locally and used when the user resumes continuous autonomous evolution.
- After a manual style comparison the painter is intentionally paused to give users time to inspect the result, optionally KEEP/REJECT, or REPEAT. PAUSE / RESUME restarts autonomous development in the chosen style.

## Reproduction semantics and limitations

An identical image requires the same original source pixels, style, seed, abstraction level and text. The comparison button intentionally fixes all except the style; repeat fixes all of them. These are real **raster drawing modes**, not AI-specific image styles or photorealistic diffusion models. A low abstraction level retains the underlying subject *more faithfully than before*, but the picture is still interpreted through a procedural brush grammar—no semantic understanding is claimed.

The new controls coexist with editable lettering, Keep/Reject learning, inherited forms, region self-critique, composition negotiations, Australian print handoff and existing advanced rules. User-locked rules remain authoritative in automatic mode. Only the requested simple controls are promoted to the main surface; full parameter configuration remains optional.

## Automated coverage

CI verifies that all five presets use different mark engines, at least four produce clearly different measured raster outcomes, identical source+seed+style reproduces identical pixels and real mark traces, LOW preserves an unmixed reference exactly before actual brushwork, and an explicitly selected style does not silently revert to hybrid across generations. Additional checks confirm the main buttons, selector and real incremental renderer path.
