import type {
  ThemeBackdropGlass,
  ThemeMessageRule,
  ThemeSound,
  ThemeStyle,
  ThemeTypeRule,
} from 'claude-code'

import {
  deepFieldSvg,
  eclipseSvg,
  murmurationSvg,
  nightRainSvg,
  oscilloscopeSvg,
  topographySvg,
} from './scenes'

/** One look: what /noir says of it, its scene (none for Void), and what it changes beside the shared base. */
export type Variant = {
  id: string
  title: string
  blurb: string
  scene?: () => string
  sound?: ThemeSound
  style?: Pick<ThemeStyle, 'Text' | 'Heading'>
}

/**
 * The glass the app lays over the scene behind its own panels, from barely there to solid. Blur smears the
 * scene's thin white lines into a haze that reads as black, so the clearer kinds blur little. Bare is the
 * default; frosted is the look the mod started with. The order here is the order /noir lists and the card shows.
 */
export const GLASS_LEVELS = {
  none: false,
  bare: { blur: 0, tint: '#000000', opacity: 0.08 },
  clear: { blur: 2, tint: '#000000', opacity: 0.2 },
  light: { blur: 6, tint: '#000000', opacity: 0.35 },
  mist: { blur: 10, tint: '#000000', opacity: 0.52 },
  frosted: { blur: 14, tint: '#000000', opacity: 0.74 },
  haze: { blur: 32, tint: '#000000', opacity: 0.55 },
  graphite: { blur: 16, tint: '#161616', opacity: 0.8 },
  smoke: { blur: 22, tint: '#000000', opacity: 0.88 },
  solid: { blur: 0, tint: '#000000', opacity: 0.97 },
} as const satisfies Record<string, ThemeBackdropGlass | false>

export type GlassLevel = keyof typeof GLASS_LEVELS

/** One line on each kind of glass, for the list. */
export const GLASS_NOTES: Record<GlassLevel, string> = {
  none: 'no glass at all: the app draws its panels its own way, unfrosted',
  bare: 'almost no glass: the scene shows sharp behind the panels',
  clear: 'a thin black film, the scene still crisp',
  light: 'a light tint with a touch of blur',
  mist: 'half see-through, the scene softened',
  frosted: 'dark frosted glass, the scene faint (the original look)',
  haze: 'heavy blur with a medium tint: the scene becomes a soft glow',
  graphite: 'dark gray glass, so the panels stand apart from the black page',
  smoke: 'nearly black, only the brightest light shows through',
  solid: 'black panels, nothing shows through',
}

export const DEFAULT_GLASS: GlassLevel = 'bare'

/** A level's name with a capital, for buttons. */
export function glassWord(level: GlassLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

export function isGlassLevel(text: unknown): text is GlassLevel {
  return typeof text === 'string' && Object.hasOwn(GLASS_LEVELS, text)
}

/**
 * What sits behind the words of a reply, over the scene. A message box can't blur what is behind it, so the
 * softer kinds use a see-through black fill with a wide black shadow: the edge fades out like smoke instead of
 * stopping at a hard rectangle. Only `black` names a text color: over a see-through fill the app picks its own
 * light text, since a color it can't promise contrast for would be dropped.
 */
export const TEXT_BACKINGS = {
  black: { color: '#e9e9e9', backgroundColor: '#000000', radius: 8 },
  soft: { backgroundColor: '#000000d6', radius: 14, shadow: { blur: 22, color: '#000000cc' } },
  smoky: { backgroundColor: '#000000a3', radius: 18, shadow: { blur: 28, color: '#000000b3' } },
  dim: { backgroundColor: '#00000066', radius: 20, shadow: { blur: 32, color: '#0000008c' } },
  halo: { backgroundColor: '#00000033', radius: 22, shadow: { blur: 32, color: '#000000e6' } },
  none: {},
} as const satisfies Record<string, ThemeMessageRule>

export type TextBacking = keyof typeof TEXT_BACKINGS

/** One line on each kind of text backing, for the list. */
export const TEXT_NOTES: Record<TextBacking, string> = {
  black: 'a solid black box: hides the scene behind the words completely',
  soft: 'nearly black with soft, smoky edges instead of a hard box',
  smoky: 'a dark see-through patch that fades out at the edges',
  dim: 'a light darkening: the scene shows faintly through the words',
  halo: 'almost no fill, but a dark glow around the text keeps it readable',
  none: 'nothing at all: the words sit right on the scene',
}

export const DEFAULT_TEXT: TextBacking = 'soft'

export function isTextBacking(text: unknown): text is TextBacking {
  return typeof text === 'string' && Object.hasOwn(TEXT_BACKINGS, text)
}

/**
 * The rows every variant shares: a black bubble with a hairline round your own messages,
 * and tool calls as quiet code rows. What sits behind a reply's words is its own setting.
 */
export const BASE_STYLE: ThemeStyle = {
  Heading: { color: '#ffffff', fontWeight: 'semibold', letterSpacing: 0.3 },
  UserMessage: {
    color: '#f2f2f2',
    backgroundColor: '#000000',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    radius: 14,
    paddingX: 14,
    paddingY: 10,
  },
  AssistantMessage: { paddingX: 6 },
  ToolUse: {
    color: '#b8b8b8',
    backgroundColor: '#050505',
    borderColor: '#1e1e1e',
    radius: 8,
    paddingX: 8,
    fontFamily: ['code'],
  },
}

const RAIN_SOUND: ThemeSound = {
  ambience: {
    layers: [
      { wave: 'pink', drone: true, gain: 0.16, filter: { type: 'lowpass', hz: 1600 } },
      { wave: 'brown', drone: true, gain: 0.1 },
      { wave: 'crackle', scatter: 2.5, gain: 0.05, filter: { type: 'highpass', hz: 2500 }, release: 0.08 },
    ],
  },
  cues: {
    send: { layers: [{ wave: 'sine', notes: ['E5'], gain: 0.1, release: 0.35 }] },
    done: { layers: [{ wave: 'bell', notes: ['B4', 'E5'], step: 0.14, gain: 0.14, release: 1.2 }], reverb: 0.4 },
    error: { layers: [{ wave: 'triangle', notes: ['E3', 'C3'], step: 0.16, gain: 0.14, release: 0.5 }] },
  },
}

const SPACE_SOUND: ThemeSound = {
  ambience: {
    layers: [
      { wave: 'sine', notes: ['A1', 'E2'], drone: true, gain: 0.12, filter: { type: 'lowpass', hz: 300, to: 520 } },
      { wave: 'bell', notes: ['E5', 'B5', 'F#6', 'A5'], scatter: 0.07, gain: 0.05, release: 3 },
    ],
    reverb: 0.6,
  },
  cues: {
    send: { layers: [{ wave: 'sine', notes: ['B5'], gain: 0.08, release: 0.4 }] },
    done: { layers: [{ wave: 'bell', notes: ['E5', 'B5', 'E6'], step: 0.12, gain: 0.12, release: 1.6 }], reverb: 0.5 },
    error: { layers: [{ wave: 'triangle', notes: ['D3', 'A2'], step: 0.18, gain: 0.12, release: 0.6 }] },
  },
}

export const VARIANTS: readonly Variant[] = [
  {
    id: 'eclipse',
    title: 'Eclipse',
    blurb: 'A black sun in a slowly turning white corona, top right. A diamond-ring glint now and then.',
    scene: eclipseSvg,
    style: { Heading: { color: '#ffffff', fontFamily: ['serif'], fontWeight: 'regular', letterSpacing: 1 } },
  },
  {
    id: 'deep-field',
    title: 'Deep Field',
    blurb: 'Stars drifting at two depths, a turning spiral galaxy, shooting stars. Has sound.',
    scene: deepFieldSvg,
    sound: SPACE_SOUND,
  },
  {
    id: 'oscilloscope',
    title: 'Oscilloscope',
    blurb: 'A phosphor X-Y scope tracing a turning Lissajous knot, a live waveform top right. Mono type.',
    scene: oscilloscopeSvg,
    style: {
      Text: { fontFamily: ['mono'], fontSize: 14, lineHeight: 22 },
      Heading: { color: '#ffffff', fontFamily: ['mono'], fontWeight: 'bold', letterSpacing: 1.5 },
    },
  },
  {
    id: 'night-rain',
    title: 'Night Rain',
    blurb: 'Rain falling in the margins, rings spreading in the puddles at the corners. Has sound.',
    scene: nightRainSvg,
    sound: RAIN_SOUND,
  },
  {
    id: 'topography',
    title: 'Topography',
    blurb: 'Contour lines of three hills on a map sheet, a slow ping running out from each summit.',
    scene: topographySvg,
  },
  {
    id: 'murmuration',
    title: 'Murmuration',
    blurb: 'A flock of starlings folding and stretching in the top right corner under a crescent moon.',
    scene: murmurationSvg,
  },
  {
    id: 'void',
    title: 'Void',
    blurb: 'Nothing at all: every pixel off but the words. The least power and no motion.',
  },
]

export const DEFAULT_VARIANT = 'deep-field'

/** Lower case, each run of anything else a hyphen, so "Deep Field" and "deep-field" both find it. */
export function keyOf(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function variantNamed(text: string): Variant | undefined {
  const key = keyOf(text)

  return VARIANTS.find(variant => variant.id === key || keyOf(variant.title) === key)
}

/** A type rule without its color, so the app picks a light text that reads on a see-through fill. */
function withoutColor(rule: ThemeTypeRule | undefined): ThemeTypeRule | undefined {
  if (rule === undefined) return undefined

  const { color: _color, ...rest } = rule

  return rest
}

/** A variant's own type laid over the base's, and the chosen backing behind a reply's words. */
export function styleOf(variant: Variant, backing: TextBacking = DEFAULT_TEXT): ThemeStyle {
  const own = variant.style ?? {}
  const isOpaque = backing === 'black'
  const text = own.Text === undefined ? BASE_STYLE.Text : { ...BASE_STYLE.Text, ...own.Text }
  const heading = { ...BASE_STYLE.Heading, ...own.Heading }
  const shownText = isOpaque ? text : withoutColor(text)

  return {
    ...BASE_STYLE,
    ...(shownText !== undefined && { Text: shownText }),
    Heading: isOpaque ? heading : (withoutColor(heading) ?? {}),
    AssistantMessage: { ...BASE_STYLE.AssistantMessage, ...TEXT_BACKINGS[backing] },
  }
}
