# OLED Noir

True-black looks for the Claude desktop app, made for OLED screens. Every surface is black or a hair above it, the text is soft white, and each look has a slow black and white scene in the margins behind the chat. Nothing bright sits still for long, which is kinder to an OLED panel.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install oled-noir --marketplace Draganoider/oled-noir
```

Answer `y` to add the marketplace, then press Enter to install for your user, so it loads in every session.

From a shell:

```
claude plugin install oled-noir --marketplace Draganoider/oled-noir
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `Draganoider/oled-noir`, then Add plugin.

The looks draw in the Claude desktop app (and the mobile app). The terminal and editors draw no themes. If another theme mod is on, turn it off first, since a session shows one theme at a time.

## Use

- `/noir` shows a card with every look and a Try button on each. Try as many as you like, then Close.
- `/noir <name>` puts one on, for example `/noir night rain`.
- `/noir next` steps to the next look.
- `/noir list` names them all.
- `/noir off` turns it off.

A fresh install starts on Deep Field with bare glass. Your choice is kept for every session and project.

## The looks

- **Eclipse**: a black sun in a slowly turning white corona, with a diamond-ring glint now and then.
- **Deep Field**: drifting stars at two depths, a turning spiral galaxy and shooting stars. Has sound.
- **Oscilloscope**: a phosphor X-Y scope tracing a turning Lissajous knot, with a live waveform. Mono type.
- **Night Rain**: rain in the margins and rings spreading in puddles at the corners. Has sound.
- **Topography**: contour lines of three hills, with a slow ping running out from each summit.
- **Murmuration**: a flock of starlings folding and stretching under a crescent moon.
- **Void**: nothing but the words, every other pixel off.

The app lays glass over the scene behind the chat. `/noir glass` lists the kinds, from most see-through to solid: `none`, `bare` (the default), `clear`, `light`, `mist`, `frosted`, `haze`, `graphite`, `smoke` and `solid`. `/noir glass <kind>` picks one, `/noir glass next` steps through them, and the Panels row on the `/noir` card does the same. The app decides which of its panels the glass covers: today that is the chat column, not the sidebar or the session rail.

Sound plays only after you press the speaker in the session's title bar. With reduced motion turned on in your system, every scene rests as a still picture.

## License

MIT. See LICENSE.
