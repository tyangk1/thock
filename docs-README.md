# THOCK 75: keyboard landing page (neo-brutalism)

Run: `node .claude/skills/scroll-craft/scripts/serve.mjs --root builds/thock --port 4513` (from `landing-lab/`), then open http://localhost:4513

## What makes it different from the sneaker store
- **Typing drives the page:** you type to play, where the sneaker page was mostly scrolling.
  - The hero is a CSS keyboard that follows the real keyboard.
  - The big headline shows what you type.
  - Every key you press drops a Matter.js keycap. Caps land on the board and can be grabbed and thrown.
  - On phones, the on-screen keys work.
- **Keyboard navigation:** 1–6 jump between sections, Space goes to the next section (outside the hero), Enter starts the race, Esc closes.
- **X-ray:** a scan line turns the halftone print into the colour photo, and layer stickers pop as it passes.
- **Switch lab:** synthesized Web Audio sounds plus a 3-round **blind test** that recommends a switch and feeds the configurator.
- **Colorways:** a block slams down, the screen shakes, and the board and the whole site theme switch.
- **Riso:** PhotoCraft Halftone Pattern prints; a lens follows the cursor and reveals the colour photo.
- **Race:** you race a 60 WPM ghost on a speedometer gauge, then a **poster PNG** is generated on canvas to share.
- **Build:** the configurator updates the price live; "Drop it in the box" sends a keycap flying into the box button.
- **Sound** is off by default; there is a toggle in the header.

## Pipeline
- **Gemini images:** 14 images (`IMAGE-PROMPTS.md`) on flat colour backgrounds, so cutouts are clean.
- **PhotoCraft:**
  - `layer.removeBackground` on the keyboards and the box.
  - `paint.remove` on the Gemini ✦ mark.
  - `filter.gallery.halftonePattern {size 2, contrast 8, dot, #111 on #F4EFE6}` for the riso twins.
- **Exploded view:** the photo can't be split into layers (3/4 view, the layers overlap vertically), so it became the X-ray scan instead.
- **DesignCraft** (`tools/logo.py`, headless):
  - Logo concepts board, then the final brand assets: wordmark **TH◉CK** (the board's knob is the O), icon **stem +** (an MX switch stem), favicon.ico/16/32/180/512, and the OG image.
  - Font: `Arial` + style `Black`. The family name "Arial Black" falls back to regular.
- **Encode:** `tools/encode.py` writes WebP files into `assets/img`.
- **Libraries:** GSAP 3.12.5 (GreenSock licence), Lenis 1.1.0 (MIT), matter-js 0.19.0 (MIT).

## Tests
`tools/shots.js` (Playwright `browser_run_code_unsafe`) covers typing, caps, X-ray, slam, riso, race, build and the box, at 1440 and 390. Both widths: 0 console errors, no horizontal overflow.
