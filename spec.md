# SmokeTrack — CRED Style Premium UI Redesign

## Current State
App is a full-featured smoking expense tracker with glass/neuro dark theme using blue-indigo primary and amber secondary. Uses Bricolage Grotesque + Satoshi fonts. Currently has glassmorphism hero card, animated stats, bottom nav, and multiple screens (Dashboard, AddEntry, Insights, History, Settings, Onboarding).

## Requested Changes (Diff)

### Add
- CRED-style design tokens: deep black backgrounds, warm gold/cream accent, near-white foreground
- Playfair Display serif font for hero numbers and key headings (pairs with existing Satoshi)
- Subtle letterpress-style card surfaces (near-invisible borders, deep shadows, no saturated colors)
- CRED-inspired typography hierarchy: serif display numbers + clean sans UI text
- Gold gradient on hero numbers and CTAs
- Ultra-minimal color palette: black, cream/gold accent, muted white — no blue/indigo/amber
- Premium bottom nav: fully dark, gold active state, no colored highlights

### Modify
- index.css: Replace entire OKLCH token set with CRED-style dark palette (deep black background, gold/cream primary, neutral surfaces)
- All component accent colors: replace blue-indigo primary → warm gold/cream; amber secondary → muted white/silver
- Glass cards: change from blue-tinted glass to pure dark glass with gold border highlights
- Hero gradient text: replace blue gradient → gold/cream gradient
- Progress bars, streaks, highlights: replace primary blue → gold accent
- Bottom nav active state: gold accent instead of blue
- Login screen: CRED-inspired minimal dark layout
- Glow effects: replace blue glow → warm gold glow

### Remove
- Blue-indigo and amber color palette entirely
- Colored icon backgrounds (replace with near-black/subtle)
- Saturated badge colors

## Implementation Plan
1. Redesign index.css with CRED OKLCH tokens (background ~8%, card ~11%, primary gold ~77% 0.09 75H, foreground ~95%)
2. Add Playfair Display font-face declaration in index.css, register in tailwind.config.js
3. Update .glass-card, .gradient-text, .glow-primary, .glow-secondary utilities to use gold/cream
4. Update Dashboard hero numbers to use font-display (Playfair) class
5. Update BottomNav active state colors
6. Update all component inline color references to use semantic tokens
7. Validate and build
