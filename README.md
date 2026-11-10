# THOCK 75 — Type anything

Live: **https://thock.yan.io.vn**

The keyboard page you can type on, in a neo-brutalist style.
- **Typing:** every key you press drops a physics keycap (Matter.js), and the headline shows what you type.
- **Keyboard navigation:** 1–6 jump between sections, Space moves to the next, Enter starts the race.
- **X-ray scan:** a scan pass reveals the board's layers.
- **Switch lab:** a blind sound test helps you pick a switch.
- **Colorway slams:** each colorway hits the page with a slam animation.
- **Riso prints:** halftone images with a develop lens.
- **Race:** a typing race against a ghost, ending in a downloadable poster.
- **Configurator:** build your board, then drop it into a pre-order box.

Pre-orders are not open yet, and nothing is charged.

## Stack
- Static HTML/CSS/JS in `site/`.
- GSAP 3.12.5 + ScrollTrigger (GreenSock Standard licence), Lenis 1.1.0 (MIT), matter-js 0.19.0 (MIT), vendored in `site/vendor/`.
- Sound is synthesised with Web Audio.
- Served by nginx (`Dockerfile`, `nginx.conf`). Deployed on Coolify, which builds this repo's Dockerfile and routes the domain to port 80.

## Run locally
```
docker build -t thock . && docker run --rm -p 8080:80 thock   # http://localhost:8080
```

## Asset pipeline (`tools/`, `video/`)
- **Product images:** Gemini (`docs-IMAGE-PROMPTS.md`) → PhotoCraft cutouts, Gemini mark removal and riso halftone (`filter.gallery.halftonePattern`) → `tools/encode.py`.
- **Brand assets:** the logo (the TH◉CK wordmark plus the "stem +" icon), favicons and the OG image are drawn in DesignCraft with `tools/logo.py`.
- **Promo video:** `video/`
  - Playwright frame capture with a frozen fake clock. CSS transitions are stepped by hand.
  - A keystroke SFX track is generated from the capture events.
  - The edit is done in EffectCraft: colour-block wipes, 12 fps stop-motion and slam shakes.
  - Music files are not included; see `video/README.md`.
