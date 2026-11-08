# Gut Run: Variant A (Game Ad)

A mobile tap-to-jump mini game for a gut-health campaign. Guide the poo through the gut, dodge the bacteria and "stress" words, and reach the end. Built with plain HTML, CSS and JavaScript on a `<canvas>`, no libraries.

## Demo

**[▶ PLAY IT HERE](https://aureliagorzna.github.io/Gut-Run/)** (best on a phone, or in your browser's mobile view)



https://github.com/user-attachments/assets/c27d1a7f-640e-4f9b-935a-916bf0c2b329



Why it is built this way: [DECISIONS.md](DECISIONS.md)

---

## Run it locally

Open `game/index.html` in your browser. No build step and no install.

> **If collision or the game doesn't work:** some browsers block pixel reads (`getImageData`) for images loaded from `file://`. In that case serve the repo root with `python3 -m http.server 8000` and open `http://localhost:8000/game/`.

Audio only starts after the first tap (browser autoplay rules).

## Debug and tuning

All settings are at the top of `game/script.js`.

| What | Where | Notes |
|---|---|---|
| Show hitboxes | `DEBUG = true` | Red = obstacles, green = player. Set to `false` for the final ad. |
| Run length | `gameplayLimit` | Share of the gut texture that is used (currently `0.3`). |
| Scroll speed | `gameSpeed` | Lower = easier. |
| Player movement | `playerFallSpeed`, `playerJumpSpeed`, `playerJumpDistance` | Gravity, hold-to-rise speed and hop height. |
| Obstacle hitbox size | `hitboxScale` | In `checkObstacleCollision` and `drawHitboxes`. Change both so debug matches. |
| Player hitbox size | `radius` / `playerRadius` | `radius` in `checkCollision` (tunnel), `playerRadius` in `checkObstacleCollision` and `drawHitboxes`. |

## What I would do next

- **Lengthen the run.** Use about 50% of the gut texture instead of 30%. I used less because I first had to place 15 obstacles somewhere playable, and a long run is both harder and too long for an ad. A longer tunnel would also fix the next point.
- **Re-place the obstacles.** They are playable but a bit too densely packed. More room would let me space them out properly.
- **Use an animation library (GSAP).** My animations are hand-written canvas code that works but is a little messy. A library would give me cleaner code and finer control. This was my first project using images and animation on canvas, and I learned a lot building it.
- **Handle mobile toolbars.** The canvas uses `vh` units, so with visible browser toolbars the bottom (CTA) can sit below the fold. `dvh` or `visualViewport` would fix this.

## Known issues and shortcuts

- **Horizontal bacteria are hard to place.** In the straight parts of the tunnel they are too wide to avoid, and in the curves they are still tight. I used them only where I could make it work.
- **Obstacles are smaller than the design.** Many are shrunk beyond the planned 50% because they were too big to dodge. Slowing the tunnel down would have helped, but the game then feels sluggish.
- **Forgiving hitboxes.** On purpose, because ad games should be easy (details in DECISIONS.md).
- **Hold-to-jump.** I extended the classic tap-to-jump so holding keeps the player rising, which avoids tedious tapping.
- **Viewport scaling is tuned for phones.** On desktop or tablet the ad can look stretched.
- **Audio on iOS needs care.** My first version waited for all assets, including audio, before starting. On iPhone Safari that blocked the whole game, because audio only loads after a tap. I fixed it by loading images independently of audio and unlocking the sounds on the first tap. From now on I will be more cautious with audio on iOS and test on a real iPhone early, not at the end.
- **Debug mode available** Switch it in `script.js`.

## AI note

I wrote the core of the game mostly myself. I used AI assistance for two areas, collision and animations, and to write clean code faster than I could, for example the whole asset loading system. That code is easy for me to understand, looks tidy and does its job.

**Where the AI got it wrong or needed control:**
- **Collision was the most problematic part.** I had to verify the results many times, check that the solution didn't produce too much code, and check that it was actually efficient.
- **Animations:** the AI tended to generate far too much code, so I kept it short. I also made sure it didn't introduce new bugs or make excessive changes elsewhere.

I read all AI-generated code and can explain it. The text in this README and DECISIONS.md was polished with AI from my own notes and checked against the code.
