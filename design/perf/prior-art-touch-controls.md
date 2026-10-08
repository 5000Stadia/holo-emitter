# Touch controls: what the best mobile first-person and exploration games do

Researched 2026-10-08, read-only. The question: the playtests found walking slower than questioning, and doors and reach cost minutes. What do others do, and what should we change?

How each claim is marked:
- **[src]** carries its link.
- **[ours]** was read from our code today.
- **[inference]** is my reasoning.

Several well-known games (Genshin, CoD Mobile, Monument Valley, Return to Monkey Island) have no primary write-up of their touch scheme that I could reach. Where only fan guides exist, I say so.

## What we have now [ours]

- **Walk:** a floating stick on the left half (`lab/touch.js`), radius 60 px, dead zone 12%.
- **Speed:** top touch speed is 1.4 m/s. Shift gives the keyboard 2.8 m/s; touch has no way to stride (`lab/manor/index.html:658`).
- **Look:** a relative drag on the right half, scaled to the screen.
- **Tap:** uses what it hits. It waits 250 ms for a possible second tap first.
- **Double tap:** goes there.
- **Use button:** the centre dot plus a 72 px button whose icon shows the action.
- **Reach:** 2.6 m (`ray.far`). People can be spoken to from 7 m.
- **Aim forgiveness:** if the dot misses, rings of rays at 24 and 48 px round it pick the nearest usable thing.
- **Doorways:** stopping on a jamb slides you up to 0.5 m sideways towards the opening.

## 1. Movement

**Floating stick: keep it.** It is the common pattern in engines, and it puts the stick where the thumb already is.
- [src] Babylon.js gives a touch to the left stick or the right by which half of the screen it lands in: `clientX < _HalfWidth` (https://unpkg.com/@babylonjs/core@8.12.1/Misc/virtualJoystick.js).
- [src] nipplejs defaults to `mode: 'dynamic'`, a new stick at each touch (https://www.npmjs.com/package/nipplejs).
- [src] A lab study compared four phone gamepads (Baldauf et al., ACM TOMM 2015). It found the floating joystick "can reduce the glances at the device". It also found that the d-pad and the joystick both "encourage drifting and unintended operations" (https://publications.ait.ac.at/en/publications/investigating-on-screen-gamepad-designs-for-smartphone-controlled/).
- [src] Fixed sticks make thumbs wander off the centre and past the rim, so players keep re-finding them (patent background, https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9937416).

**Run by stick distance.** This is the clearest gap.
- [src] **Apple, WWDC26 session 358 "Make your game great with touch":** a small tilt walks and a large tilt sprints, "so players don't need a second finger". Their example: `magnitude > 0.8` gives `runModifier 1.3`. The stick glows while sprinting, so "it's immediately clear the character is in sprint mode" (https://developer.apple.com/videos/play/wwdc2026/358/).
- [src] **PUBG Mobile:**
  - holding the stick in one direction starts a sprint after a while;
  - pushing past the edge of the circle sprints sooner;
  - dragging the thumb onto a running icon locks the sprint, so you can let go and keep running.

  Sources: https://www.pocketgamer.co.uk/playerunknowns-battlegrounds/pubg-for-mobile-cheats-and-tips-essential-tips-to-master-touch-screen-controls/, https://www.mejoress.com/correr-en-pubg-mobile/ (both from 2018).
- [src, fan guide] CoD Mobile players are told to turn "always sprint" on (https://gameboost.com/blog/5-tips-that-will-make-you-better-in-cod-mobile).
- [unverified] Genshin is said to walk on a partial push and run on a full one. I found no primary source for this.

**Auto-walk and hold-to-walk.**
- [src] realMyst on iOS: "touch and hold to move, swipe to turn". Two fingers held walk you backwards (https://apps.apple.com/us/app/-/id524988885; https://www.appgefahren.de/?p=44825).
- [src] Thimbleweed Park on touch: double-tap and hold makes the character follow your finger, "instead of having to keep tapping … to go for a long walk" (https://appunwrapper.com/2017/09/20/thimbleweed-park-touch-controls-guide/).

**Tap-to-go.**
- [src] Every point-and-click port uses tap-to-go:
  - Return to Monkey Island has you "tapping to move around" (https://toucharcade.com/2023/07/27/return-to-monkey-island-mobile-review-controller-support-steam-deck-nintendo-switch-iphone-ipad-ios-android/);
  - Monument Valley moves the character by a tap (https://en.wikipedia.org/wiki/Monument_Valley_(video_game));
  - Myst (Legacy) for Mobile navigates "with a simple touch or swipe" (https://apps.apple.com/us/app/myst-legacy-for-mobile/id311941991).
- [src] **Myst Mobile (2023, full 3D):** it added a "legacy navigation mode" and a "one-touch navigation mode", with a first-run prompt for each. Early App Store reviews had said "There's no tutorial on the controls". A later review says "the options make it much more playable on mobile" (https://apps.apple.com/us/app/myst-mobile/id6444813759). The lesson: a full 3D walking game on a phone needed a tap-to-go mode added after launch.
- [inference] Our double tap is a teleport, so it is quicker than any of these. What it lacks is a way to get to places you can't see: a room two doors away, or the floor above.

**Fast travel.**
- [src] Thimbleweed Park's fast travel is what makes its large map bearable: "You're not walking all around the map, but teleporting" (https://appunwrapper.com/2017/09/20/thimbleweed-park-touch-controls-guide/).

## 2. Look

**A touchpad, not a stick.**
- [src] Apple: a stick for the camera "can cause over-rotation, and can feel sluggish". A touchpad "moves exactly as far as their finger moves, with no latency or drift". Use relative values over the whole right side (WWDC26 358, above).
- [inference] We already do this.

**Acceleration.** I found no primary study of acceleration curves for touch look.
- [src, weak] Players ask for it so they don't have to flick back and forth (https://feedback.minecraft.net/hc/en-us/community/posts/38178219539853/comments/43413698618125).
- [inference] Gentle acceleration on fast swipes would turn you round quicker in a corridor. Slow drags would stay 1:1. That is low priority, since you look less than you walk.

**Sensitivity setting.**
- [src] The Game Accessibility Guidelines (Basic) ask for "an option to adjust the sensitivity of controls" (https://gameaccessibilityguidelines.com/?p=21).
- [src] Xbox's XAG 107 asks for sensitivity on each analog input separately, over "at least ± 50% of the default" (https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-107-input.md).

**Gyro aim.**
- [src, weak] The evidence is mixed. A small 2024 study (11 people, a controller rather than a phone) found gyro less accurate than a stick (https://arxiv.org/abs/2411.15538).
- [src] On the web, iOS needs `DeviceOrientationEvent.requestPermission()` from a user gesture, over HTTPS, and the answer is remembered with no way to ask again (https://developer.apple.com/forums/thread/128376; https://caniuse.com/mdn-api_deviceorientationevent_requestpermission_static).
- [inference] Not worth it for a mystery game. Shooters use gyro for fine aim, and we don't need fine aim.

## 3. Interaction

**Tapping the world directly.**
- [src] **Gone Home iOS, the nearest analogue to us:**
  - stick on the left, camera on the right, crouch button;
  - a "touch anywhere to select" option lets you tap objects instead of aiming the reticle. A reviewer said it makes it "feel much more like a touchscreen adventure game";
  - settings also hide the reticle, invert the camera, swap left and right, and turn on haptics.

  Steve Gaynor: he "could play through the whole game well on touch". Sources: https://www.appunwrapper.com/2018/12/15/gone-home-ios-review/, https://www.appunwrapper.com/2018/12/16/gone-home-interview-steve-gaynor/.
- [src] Fortnite mobile has three touch interaction modes, documented in Epic's own post (https://www.fortnite.com/news/getting-started---fortnite-for-mobile):
  - "Easy Interact" (larger, clearer icons) is the default for new players;
  - "In World" lets you tap the item or press the button;
  - "Off" uses the button only.

**Context button.**
- [src] Apple: change the button's icon to match its current use. "Don't leave controls visible that players can not use." Their pickup button appears only when an item is near, and is placed next to it. Every control needs "a visible pressed state" (WWDC26 358).
- [inference] We do this already, except for placing the button by the object.

**Target size and magnetism.**
- [src] Touch target sizes:
  - Parhi, Karlson and Bederson (MobileHCI 2006): 9.2 mm targets for single taps and 9.6 mm for runs of taps (https://dx.doi.org/10.1145/1152215.1152260);
  - Google: at least 48 dp, about 9 mm (https://support.google.com/accessibility/android/answer/7101858);
  - Game Accessibility Guidelines: "large and well spaced, particularly on small or touch screens".
- [src] The **bubble cursor**, which always selects the nearest target, beat a point cursor in both of its experiments (Grossman & Balakrishnan, CHI 2005, https://www.dgp.toronto.edu/papers/tgrossman_CHI2005.pdf).
- [src] **Shift** (Vogel & Baudisch, CHI 2007) fixes a finger hiding a small target: it shows the hidden area in a callout. Error rates on small targets fell well below those of a plain touch screen (https://projects.csail.mit.edu/hci-reading/papers/chi2007-vogel.pdf).
- [src] **Sticky targets** (Mandryk & Gutwin, GI 2008): slowing the cursor over a target made targeting significantly faster. Users didn't notice small amounts (https://graphicsinterface.org/proceedings/gi2008/gi2008-9).
- [src] Halo's "magnetism/friction" slows turning while the reticle is near a target. It is tuned to go unnoticed (https://halopedia.org/Magnetism).
- [ours] Our 24/48 px rings are a bubble cursor in all but name. 48 px is about 7–8 mm on a 3× phone, a little under the 9 mm minimum.

**Highlighting.**
- [inference] When focus jumps to a ring hit, the only sign that you have aimed at a thing is the button's icon. Halo and Apple both show which target is chosen. A faint outline or glow on the focused object, if it renders cheaply, would show it in the world too.

**Doors.**
- [src] PUBG Mobile: "Doors will also open automatically" (Pocket Gamer, above).
- [src, fan guide] Fortnite has an "Auto Open Doors" setting, "so doors open as you approach them" (https://steelseries.com/pl-pl/blog/how-win-fortnite-mobile-81).
- [src] Epic says "Auto Open Containers" is ON by default for mobile (https://www.epicgames.com/help/fortnite-battle-royale-c-202300000001636/gameplay-c-202300000001721/how-do-i-turn-on-off-auto-open-containers-in-fortnite-mobile-a202300000086491).
- [src] Thimbleweed Park on touch: a double tap does the default verb, and for doors that is Open/Close (guide above).

**The tap delay.**
- [src] Browsers made every tap wait 300–350 ms for a possible double tap. Chrome dropped the wait in 2014 because it made pages feel sluggish (https://developer.chrome.com/blog/300ms-tap-delay-gone-away).
- [ours] Our 250 ms wait is the same cost, paid on every use.

## 4. Doorways

Nothing I found was written about first-person doorways. The prior art is corner correction from 2D action games, and wall sliding.
- [src] It works well:
  - "it's a lot easier to stop at a wall than it is to navigate zig zags without the feature";
  - people undershoot more than they overshoot, so the window should forgive undershooting;
  - keep the correction to the direction of travel, for consistency;
  - use capsules, not boxes, for the body.

  Sources: https://itch.io/post/1495247, https://www.lexaloffle.com/bbs/?tid=2041.
- [inference] We correct only after you stop at a jamb. The usual fix bends your heading towards the doorway's centre line before you reach it, when you are walking roughly at an open doorway (within about 30°, within 1.5 m). Stopping and sliding would then become rare.

## 5. Thumb zones, safe areas, orientation

- [src] **Placement (Apple):** frequent actions go near the thumbs, rare ones at the top, nothing in the centre. Add `safeAreaInsets` to control offsets. Design for full screen (WWDC26 358).
- [ours] All of this is done.
- [src] **How people hold phones:** Hoober saw 49% of people using one hand, 36% cradling and 15% using two hands (UXmatters 2013, via https://smashingmagazine.com/2016/09/the-thumb-zone-designing-for-mobile-users). That is everyday use, not games.
- [inference] Landscape with two thumbs stays right for walking and looking. If tap-to-go got good enough, a one-handed portrait mode would become possible. Leave it for later.
- [src] Gone Home offers a left/right swap. XAG 107 asks for adjustable size, spacing and position of touch targets, and preset layouts.

## 6. Onboarding

- [src] Myst Mobile's reviews show the cost of having no control tutorial. Cyan later added first-run prompts (App Store page, above).
- [src] Gone Home's intro explains the layout once (appunwrapper, above).
- [inference] Best are just-in-time hints, shown at the moment a player gets stuck:
  - pressing into a jamb for more than 1 s: "double-tap the doorway to go through";
  - several stick walks longer than 10 s: "push to the edge to stride".

  We already do this for reach ("out of reach … Double-tap to go to it").

## 7. Accessibility

- [src] Game Accessibility Guidelines:
  - avoid holding buttons down; toggles or automatic actions are fine, sprinting being their example;
  - offer sensitivity;
  - large, well-spaced controls.

  Source: https://gameaccessibilityguidelines.com/avoid-provide-alternatives-to-requiring-buttons-to-be-held-down/.
- [inference] Run by stick distance and a sprint lock both meet the hold rule. A crouch toggle already does.

## Ranked changes for our controls

Effect is against the playtest pains: walking speed, doors, reach. Cost: S under a day, M a few days, L more.

1. **Stride by stick distance. [src: Apple WWDC26 358, PUBG; S]**
   - Past about 80% of the stick's reach, ramp to the keyboard's stride of 2.8 m/s, so twice our walking speed.
   - Glow the knob while striding.
   - Effect: about half the walking time; no new button.
2. **Lock the stride by pushing past the rim. [src: PUBG sprint lock; S–M]**
   - A small marker above the stick: slide onto it and let go, and you keep striding where you look.
   - Any touch on the left half stops it.
   - Effect: long halls and the grounds walked with one thumb free to look.
3. **Act on the tap at once, not after 250 ms. [src: Chrome on the tap delay; S–M]**
   - Do it where a second tap can't matter: taking, talking, looking.
   - Keep the wait only on doors and switches. There, a second tap means "go there", per Kabe's 2026-10-07 rule.
   - Show the focus at once on touch-down, so the wait isn't silent.
   - Effect: every use feels immediate.
4. **Walk into a shut, unlocked door to open it. [src: PUBG, Fortnite; S]**
   - Only on the stick, only facing the door, after about 0.3 s of pushing.
   - Locked doors still refuse, with their padlock.
   - Effect: removes the stop-aim-tap-walk loop at every door.
   - Kabe's call, since doors are part of the puzzles.
5. **Steer towards the doorway, ahead of the jamb. [src: corner correction, itch.io/lexaloffle; inference for 3D; S–M]**
   - When walking within about 30° of an open doorway and within 1.5 m, bend the heading towards its centre line.
   - The jamb slide stays as the backstop.
   - Effect: fewer stalls at doors; works with item 4.
6. **Tap a thing out of reach to walk to it and use it. [src: point-and-click adventures, Thimbleweed, Monkey Island; M]**
   - Today it says "out of reach".
   - Instead: glide or teleport (`goTo`) to its front, then act. A second tap within the glide cancels.
   - Effect: reach stops costing anything. Kabe's call, because it changes the meaning of a single tap.
7. **Look slows near interactable things. [src: Mandryk & Gutwin 2008, Halo friction; S]**
   - Scale look gain by about 0.6 while the dot's rings hold a target. Fast swipes stay unaffected.
   - Effect: the dot lands on keys and bars with fewer overshoots.
8. **Highlight what has the focus. [src: Apple's "visible pressed state"; inference for in-world; S–M]**
   - A faint rim or glow on the focused object, alongside the button's icon.
   - Effect: you see which drawer the ring picked before you press.
9. **Widen the touch rings to 9 mm. [src: Parhi 2006, Google 48 dp; S]**
   - Rings sized in mm from `devicePixelRatio` and the physical screen, rather than 48 px.
   - Effect: small items found on the first tap, especially on 3× phones.
10. **Just-in-time hints. [src: Myst Mobile reviews; inference for when to show them; S]**
    - "Push to the edge to stride", shown after the first long walk.
    - "Double-tap the doorway", shown after a jamb stall.
    - Each shown once, never again.
11. **Settings: look sensitivity (±50%), swap left and right, invert look. [src: GAG, XAG 107, Gone Home; S]**
12. **Travel by room, a list or the plan. [src: Thimbleweed fast travel, Myst one-touch navigation; M–L]**
    - Go to any room already visited.
    - Effect: the biggest saving on a big house, but it changes the feel. Kabe's call, and it may belong to the dynamic-generation framework, not now.
13. **Look acceleration on fast swipes. [inference; weak sources; S]** Turn round in corridors faster. Low gain.
14. **Gyro look. [src: mixed evidence, iOS permission cost; M]** Not recommended.

Items 1–5 together are about two days. They address all three playtest pains, and none of them adds a button.
