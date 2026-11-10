# THOCK promo video pipeline

Outputs: `out/thock-reels.mp4` (1080×1920, 25.9 s) and `out/thock-youtube.mp4` (1920×1080, 46.2 s).

How it differs from the SOLE/LAB video:
- **The rhythm comes from keystrokes.** Every typed key, caption character, slam and switch press is logged with its exact frame in `events.json`. `sfx.py` builds a keyboard SFX track from those events and mixes it under the music.
- **Stop-motion.** The hero and the footer get EffectCraft Posterize Time at 12 fps.
- **Brutalist transitions.** A full-frame colour block slides across every cut, with a swoosh in the SFX track. Every slam shakes the frame.
- **Typewriter captions.** Brutalist stickers type one character per 16th note.

Music: Pixabay **"Bubblefloor (Instrumental)" by Turning_Pages (ID 430172)**. Its page did not show "Content ID Registered" when checked on 2026-11-10. Analysed at 125.19 BPM with its downbeat at 0.44 s, which gives 57.514 frames per bar. Structure: 4 quiet intro bars, the beat comes in at bar 4, it lifts at bar 8, with breaks at bars 15 and 21. The first cut used a phonk track; the owner found it too close to the sneaker video, so it was replaced.
- Reels starts at bar 2, so the beat comes in on the hero.
- YouTube starts at bar 0: the intro plays over the loader, the beat comes in on the hero and lifts at the X-ray.
- Other candidates without Content ID, kept in audio/: Ultrafi "Stutterbass funk" and "Vibraphonecheck", Epicsongs "Funky Groove".

Run:
```
node capture.mjs reels      # plates + frames/reels/events.json (fake clock: GSAP, Lenis, Matter.js, CSS animations AND transitions)
python sfx.py reels         # audio/reels-sfx.wav
python edit.py reels        # audio/reels-music.wav + edit-reels.json
effectcraft-cli run --commands edit-reels.json --empty --save-as reels.ecproj
effectcraft-cli render --project reels.ecproj --comp reels --out out/thock-reels-raw.mp4 --format h264 --audio on --bitrate 16000
ffmpeg -i out/thock-reels-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.0:LRA=11 -ar 48000 -c:a aac -b:a 192k -movflags +faststart out/thock-reels.mp4
```

Gotchas:
- **Colour slams take about 1.3 s.** A second click during a slam is ignored, so keep slams 40 or more frames apart.
- **Overlay captions need clearing.** Clear them at the start of every scene, or they leak into the next one.
- **Reels caption placement.** Captions go in the lower half of the hero, at 58% of the height, which is inside the safe zone and keeps the headline clear.
- **Stepping the fake clock.** `lib.mjs` pauses every CSS transition and advances it by hand on each step. THOCK relies heavily on transitions for key presses, the X-ray tags and the riso lens.
