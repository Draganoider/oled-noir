# Changelog

All notable changes to OLED Noir are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/).

## [1.3.5] - 2026-11-25

### Changed

- Links, the icons beside them, toggles and focus rings keep the app's own blue accent instead of turning white, so a link looks like a link.

## [1.3.4] - 2026-11-25

### Fixed

- **Starfall** could freeze and drop to a lower resolution on wide or large screens: the app budgets a shader by the area it says it draws, and Starfall claimed far more than its stars cover. It now claims what it draws, with slimmer strips, and costs about half as much a frame on slower GPUs.

## [1.3.3] - 2026-11-25

### Changed

- **Starfall** falls the whole time Claude works, evenly spaced, with no gaps: the setting changes how thick the stream is, not whether a star comes. Every kind starts with at least a star a second, and the ceilings are higher (`storm` reaches twenty a second).
- Every falling star starts inside the window.

## [1.3.2] - 2026-11-24

### Changed

- Starfall draws its stars straight over the scene, with no texture the size of the window, so a 4K window costs no more than the stars it shows. It now runs at full sharpness on slower GPUs too.

## [1.3.1] - 2026-11-24

### Changed

- **Starfall** builds up: the longer Claude works, the more stars fall, up to many a second, then the shower tapers off when it stops. Before, it fell back to one star every eight seconds whenever a tool ran.
- `/noir stars` sets how thick the shower grows: `gentle`, `steady` (the default), `shower` or `storm`. The card has a Starfall row for it.
- Falling stars are smeared over each frame's travel, so they move smoothly on 120 and 240 Hz screens, where the app's 60-frame shader would otherwise step.
- Each star is drawn only where it falls, so many stars cost less than the few did before.

## [1.3.0] - 2026-11-24

### Added

- **Starfall**: Starfield's sky, but stars fall only while Claude works, and more of them the faster it writes. A shader draws them; with reduced motion, or where the app can't play it, the sky stays still.

## [1.2.0] - 2026-11-24

### Added

- **Full Moon**: a full moon in the top right corner, its seas soft gray, a halo breathing round it, and thin moonlit clouds drifting past now and then.

## [1.1.1] - 2026-11-24

### Changed

- A fresh install now starts on Starfield.

## [1.1.0] - 2026-11-24

### Added

- **Starfield**: Deep Field's sky without the galaxy. Only stars drifting at two depths, and now and then a star falls.

## [1.0.1] - 2026-11-24

### Changed

- Your own messages now start with the `outline` bubble: black with a thin gray edge.

## [1.0.0] - 2026-11-24

The first public release.

### Added

- Seven true-black looks for the Claude desktop app: Eclipse, Deep Field, Oscilloscope, Night Rain, Topography, Murmuration and Void.
- Slow animated scenes in white light, kept to the margins and resting as still pictures under reduced motion.
- Quiet generated sound for Deep Field and Night Rain, off until you press the speaker.
- `/noir`: a card to try every look and setting, plus `/noir <look>`, `next`, `list` and `off`.
- Four settings, each kept across sessions and projects:
  - `/noir glass`: ten kinds of glass over the scene, from `none` to `solid`.
  - `/noir text`: what sits behind reply text, from a solid box to nothing.
  - `/noir bubble`: six looks for your own messages.
  - `/noir tools`: seven looks for tool call rows.
- A true-black palette: a `#000000` page, soft white text, and faintly tinted status colors.

[1.3.5]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.5
[1.3.4]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.4
[1.3.3]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.3
[1.3.2]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.2
[1.3.1]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.1
[1.3.0]: https://github.com/Draganoider/oled-noir/releases/tag/v1.3.0
[1.2.0]: https://github.com/Draganoider/oled-noir/releases/tag/v1.2.0
[1.1.1]: https://github.com/Draganoider/oled-noir/releases/tag/v1.1.1
[1.1.0]: https://github.com/Draganoider/oled-noir/releases/tag/v1.1.0
[1.0.1]: https://github.com/Draganoider/oled-noir/releases/tag/v1.0.1
[1.0.0]: https://github.com/Draganoider/oled-noir/releases/tag/v1.0.0
