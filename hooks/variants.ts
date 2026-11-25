import type {
  ThemeBackdropGlass,
  ThemeMessageRule,
  ThemeToolRule,
  ThemeSound,
  ThemeStyle,
  ThemeTypeRule,
} from 'claude-code'

import {
  deepFieldSvg,
  eclipseSvg,
  fullMoonSvg,
  murmurationSvg,
  nightRainSvg,
  oscilloscopeSvg,
  starfallSvg,
  starfieldSvg,
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
  /** True when the scene answers Claude's work: a shader over it, told when Claude works and how fast. */
  isLive?: boolean
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

export const DEFAULT_TEXT: TextBacking = 'smoky'

export function isTextBacking(text: unknown): text is TextBacking {
  return typeof text === 'string' && Object.hasOwn(TEXT_BACKINGS, text)
}

/**
 * How your own messages look. The opaque kinds name their text color; over a see-through fill the app
 * picks its own, as for reply text.
 */
export const USER_BUBBLES = {
  outline: { color: '#f2f2f2', backgroundColor: '#000000', borderColor: '#3a3a3a', borderWidth: 1, radius: 14 },
  ring: { color: '#ffffff', backgroundColor: '#000000', borderColor: '#d9d9d9', borderWidth: 1.5, radius: 22 },
  soft: { backgroundColor: '#000000d6', radius: 16, shadow: { blur: 22, color: '#000000cc' } },
  glass: { backgroundColor: '#ffffff14', borderColor: '#ffffff33', borderWidth: 1, radius: 16 },
  inverted: { color: '#0a0a0a', backgroundColor: '#f2f2f2', radius: 16 },
  none: {},
} as const satisfies Record<string, ThemeMessageRule>

export type UserBubble = keyof typeof USER_BUBBLES

/** One line on each kind of bubble, for the list. */
export const BUBBLE_NOTES: Record<UserBubble, string> = {
  outline: 'a black bubble with a thin gray outline (the original look)',
  ring: 'a black pill with a bright white outline',
  soft: 'nearly black with smoky, fading edges, like the soft reply text',
  glass: 'a faint white tint with a light edge, like frosted glass',
  inverted: 'a white bubble with black words, so your messages stand out',
  none: 'no bubble: your words sit right on the scene',
}

export const DEFAULT_BUBBLE: UserBubble = 'outline'

export function isUserBubble(text: unknown): text is UserBubble {
  return typeof text === 'string' && Object.hasOwn(USER_BUBBLES, text)
}

/**
 * How the rows of Claude's tool calls look ("Edited a file, ran 3 commands"). The opaque kinds name their
 * text color; the soft one lets the app pick, as for reply text.
 */
export const TOOL_ROWS = {
  card: { color: '#b8b8b8', backgroundColor: '#050505', borderColor: '#1e1e1e', radius: 8, fontFamily: ['code'] },
  outline: { color: '#a6a6a6', backgroundColor: '#000000', borderColor: '#3a3a3a', radius: 8, fontFamily: ['code'] },
  terminal: {
    color: '#e6e6e6',
    backgroundColor: '#000000',
    borderColor: '#e6e6e6',
    borderWidth: 1,
    radius: 2,
    fontFamily: ['code'],
  },
  pill: { color: '#d0d0d0', backgroundColor: '#111111', radius: 20, paddingX: 14, fontFamily: ['sans'] },
  soft: { backgroundColor: '#000000d6', radius: 12, shadow: { blur: 18, color: '#000000cc' }, fontFamily: ['code'] },
  quiet: { color: '#7a7a7a', backgroundColor: '#000000', radius: 0, paddingX: 2, fontFamily: ['code'] },
  none: {},
} as const satisfies Record<string, ThemeToolRule>

export type ToolRow = keyof typeof TOOL_ROWS

/** One line on each kind of tool row, for the list. */
export const TOOL_NOTES: Record<ToolRow, string> = {
  card: 'a near-black card with a faint edge and code type (the original look)',
  outline: 'black with a clearer gray outline',
  terminal: 'black with a thin white frame and bright code type, like a terminal',
  pill: 'a rounded dark pill in plain type',
  soft: 'nearly black with smoky, fading edges',
  quiet: 'dim gray code type on black, no frame: barely there',
  none: "the app's own tool rows",
}

export const DEFAULT_TOOL: ToolRow = 'pill'

export function isToolRow(text: unknown): text is ToolRow {
  return typeof text === 'string' && Object.hasOwn(TOOL_ROWS, text)
}

/**
 * How thick Starfall's shower grows. `base` is stars a second as work begins, `peak` stars a second at the
 * height of it, `ramp` the seconds of work it takes to get there. Writing fast adds a fifth on top; after
 * Claude stops, the shower tapers off over about twelve seconds.
 */
export const STAR_DENSITIES = {
  gentle: { base: 0.15, peak: 2, ramp: 240 },
  steady: { base: 0.3, peak: 5, ramp: 150 },
  shower: { base: 0.6, peak: 10, ramp: 90 },
  storm: { base: 1.2, peak: 18, ramp: 45 },
} as const

export type StarDensity = keyof typeof STAR_DENSITIES

/** One line on each density, for the list. */
export const STAR_NOTES: Record<StarDensity, string> = {
  gentle: 'a star every few seconds at first, about two a second after four minutes of work',
  steady: 'one every three seconds at first, about five a second after two and a half minutes',
  shower: 'a couple a second soon, about ten a second after a minute and a half',
  storm: 'a storm within a minute: up to eighteen a second',
}

export const DEFAULT_STARS: StarDensity = 'steady'

export function isStarDensity(text: unknown): text is StarDensity {
  return typeof text === 'string' && Object.hasOwn(STAR_DENSITIES, text)
}

/**
 * The rows every variant shares: a black bubble with a hairline round your own messages,
 * and tool calls as quiet code rows. What sits behind a reply's words is its own setting.
 */
export const BASE_STYLE: ThemeStyle = {
  Heading: { color: '#ffffff', fontWeight: 'semibold', letterSpacing: 0.3 },
  UserMessage: { paddingX: 14, paddingY: 10 },
  AssistantMessage: { paddingX: 6 },
  ToolUse: { paddingX: 8 },
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
    id: 'starfield',
    title: 'Starfield',
    blurb: 'Only stars, drifting at two depths, and now and then a star falls. Has sound.',
    scene: starfieldSvg,
    sound: SPACE_SOUND,
  },
  {
    id: 'starfall',
    title: 'Starfall',
    blurb: "Starfield's sky, but stars fall only while Claude works, more and more the longer it works. Has sound.",
    scene: starfallSvg,
    sound: SPACE_SOUND,
    isLive: true,
  },
  {
    id: 'full-moon',
    title: 'Full Moon',
    blurb: 'A full moon top right, its seas soft gray, a halo breathing round it, thin clouds drifting past.',
    scene: fullMoonSvg,
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

export const DEFAULT_VARIANT = 'starfield'

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

/** A variant's own type laid over the base's, the backing behind a reply's words, and your bubble. */
export function styleOf(
  variant: Variant,
  backing: TextBacking = DEFAULT_TEXT,
  bubble: UserBubble = DEFAULT_BUBBLE,
  tool: ToolRow = DEFAULT_TOOL,
): ThemeStyle {
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
    UserMessage: { ...BASE_STYLE.UserMessage, ...USER_BUBBLES[bubble] },
    ToolUse: tool === 'none' ? {} : { ...BASE_STYLE.ToolUse, ...TOOL_ROWS[tool] },
  }
}
