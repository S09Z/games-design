# Phase 6 — Audio

Goal: Hook up sound effects to game events.

## Approach
Keep the existing `js/audio/audioManager.js` (Web Audio API, procedural) or port to a simpler pattern. Pre-recorded assets would be higher quality but require asset generation.

## Tasks

- [ ] Decide: keep procedural audio or switch to pre-recorded assets
- [ ] If procedural: extract audio calls from existing `audioManager.js`
- [ ] If pre-recorded: generate 10 sound effects as OGG/WAV
- [ ] Hook audio into game event bus:
  | Event | Sound |
  |---|---|
  | `fire` / `boulder-release` | Whoosh / trebuchet creak |
  | `impact` | Stone crash / thud |
  | `enemy-kill` | Guard yell / king groan |
  | `victory` | Fanfare |
  | `defeat` | Sad trombone / sigh |
  | `button-click` | UI click |
  | `pause` / `unpause` | Soft chime |
  | `ammo-empty` | Click / empty sound |
- [ ] Volume control tied to UI toggle switches
- [ ] Mute state persisted to localStorage

## Verification

- Sound plays on fire, impact, kill
- UI sounds on button clicks
- Music/sound toggles work
- Mute state persists across reloads
