import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeBackdropGlass, ThemeResult, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import {
  BUBBLE_NOTES,
  DEFAULT_BUBBLE,
  DEFAULT_TOOL,
  DEFAULT_GLASS,
  DEFAULT_STARS,
  DEFAULT_TEXT,
  DEFAULT_VARIANT,
  GLASS_LEVELS,
  GLASS_NOTES,
  STAR_DENSITIES,
  STAR_NOTES,
  TEXT_BACKINGS,
  TEXT_NOTES,
  TOOL_NOTES,
  TOOL_ROWS,
  USER_BUBBLES,
  VARIANTS,
  glassWord,
  isGlassLevel,
  isStarDensity,
  isTextBacking,
  isToolRow,
  isUserBubble,
  keyOf,
  styleOf,
  variantNamed,
} from './variants'
import type { GlassLevel, StarDensity, TextBacking, ToolRow, UserBubble, Variant } from './variants'

const PLUGIN = 'oled-noir'
const COMMAND = 'noir'
// One choice for every session and project: the look is yours, not the project's.
const CHOICE_KEY = 'variant'
const GLASS_KEY = 'glass'
const TEXT_KEY = 'text'
const BUBBLE_KEY = 'bubble'
const TOOL_KEY = 'tools'
const STARS_KEY = 'stars'
const OFF = 'off'
const GLASS_ORDER = Object.keys(GLASS_LEVELS) as GlassLevel[]
const TEXT_ORDER = Object.keys(TEXT_BACKINGS) as TextBacking[]
const BUBBLE_ORDER = Object.keys(USER_BUBBLES) as UserBubble[]
const TOOL_ORDER = Object.keys(TOOL_ROWS) as ToolRow[]
const STAR_ORDER = Object.keys(STAR_DENSITIES) as StarDensity[]

const isCardOpen = atom({ plugin: 'oled-noir', key: 'isCardOpen' } as const, false)
const applied = atom({ plugin: 'oled-noir', key: 'applied' } as const, null)
const panelGlass = atom({ plugin: 'oled-noir', key: 'glass' } as const, null)
const textBacking = atom({ plugin: 'oled-noir', key: 'text' } as const, null)
const userBubble = atom({ plugin: 'oled-noir', key: 'bubble' } as const, null)
const toolRow = atom({ plugin: 'oled-noir', key: 'tools' } as const, null)
const starDensity = atom({ plugin: 'oled-noir', key: 'stars' } as const, null)

// True black for an OLED panel: every surface sits a hair above #000, text is soft white (not pure,
// which blooms on OLED), and the roles keep just enough hue that red still means trouble.
const { theme: COLORS, problems } = makeColors({
  label: 'OLED Noir',
  id: 'oled-noir',
  only: 'dark',
  roles: { accent: '#ffffff', danger: '#ff6b6b', success: '#8fd19e', warning: '#e6c77e', pro: '#bdbdbd' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#000000',
        'surface-1': '#0b0b0b',
        'surface-2': '#121212',
        'surface-3': '#181818',
        'text-primary': '#f2f2f2',
        'text-secondary': '#c4c4c4',
        'text-muted': '#8f8f8f',
      },
    },
  },
})

const UNPAINTED = problems.find(line => line.startsWith("Desktop won't paint"))

// Scenes are built once per load: each is a long string.
const sceneCache = new Map<string, string>()

export function sceneSource(variant: Variant): string | undefined {
  if (variant.scene === undefined) return undefined

  let source = sceneCache.get(variant.id)

  if (source === undefined) {
    source = variant.scene()
    sceneCache.set(variant.id, source)
  }

  return source
}

// ---------------------------------------------------------------- Starfall's pace
//
// Starfall's stars fall only while Claude works, more and more the longer it works. The mod tells its
// shader whether Claude is working (any turn of this session running, subagents' too), how fast it wrote
// in its last step, and the /noir stars setting. The build-up over time happens in the shader itself, so
// the mod sends only changes: a turn starting or ending, a step's pace, a new setting.
//
// The pace is a step's streamed text, thinking and tool input, about four characters a token, over the
// step's time, cut to three steps so the sky changes a few times a turn rather than on every word.

/** Tokens a second that count as full pace. */
const FULL_PACE = 90
const PACE_STEPS = 3

export type LiveValues = { working: number; pace: number; base: number; peak: number; ramp: number }

const runningTurns = new Set<string>()
let lastPace = 0
let density: StarDensity = DEFAULT_STARS
let sentValues: LiveValues = liveValues(0, 0)
// Whether the backdrop drawn last was a live look: no redrawing for the others.
let isLiveDrawn = false

/** What the shader is told now. */
export function liveValues(
  running = runningTurns.size,
  tokensPerSecond = lastPace,
  stars: StarDensity = density,
): LiveValues {
  const steps = PACE_STEPS - 1
  const pace = running === 0 ? 0 : Math.round(Math.min(tokensPerSecond / FULL_PACE, 1) * steps) / steps

  return { working: running === 0 ? 0 : 1, pace, ...STAR_DENSITIES[stars] }
}

/** Redraws the backdrop when what the shader is told has changed, and only then. */
function sendValues($: EngineInterface): void {
  const now = liveValues()
  const isSame = (Object.keys(now) as (keyof LiveValues)[]).every(name => now[name] === sentValues[name])

  if (isSame) return

  sentValues = now

  if (isLiveDrawn) $.ui.invalidate('ui.render')
}

/** How thick Starfall's shower grows: the stored density, else the default. A store that fails counts as none. */
async function storedStars($: EngineInterface): Promise<StarDensity> {
  try {
    const stored = await $.store.get(STARS_KEY)

    return isStarDensity(stored) ? stored : DEFAULT_STARS
  } catch {
    return DEFAULT_STARS
  }
}

/** Keeps a density and tells the shader at once: the look itself stays as it is. */
async function setStars($: EngineInterface, stars: StarDensity): Promise<string> {
  try {
    await $.store.set(STARS_KEY, stars)
  } catch (error) {
    return `The star density could not be saved: ${reasonOf(error)}`
  }

  density = stars
  await update($, starDensity, () => stars)
  sendValues($)

  const now = await read($, applied)
  const where = now === 'starfall' ? '' : ` It shows on Starfall: /${COMMAND} starfall.`

  return `Starfall now falls ${stars}: ${STAR_NOTES[stars]}.${where}`
}

function starsList(now: StarDensity): string {
  return [
    `How thick Starfall's shower grows while Claude works (now ${now}):`,
    ...STAR_ORDER.map(stars => `  ${stars === now ? '✓' : ' '} ${stars}: ${STAR_NOTES[stars]}`),
    `/${COMMAND} stars <kind> picks one, /${COMMAND} stars next steps to the next.`,
  ].join('\n')
}

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** A kind of glass as the theme takes it: a fresh object, or false for none. */
function glassOf(level: GlassLevel): ThemeBackdropGlass | false {
  const glass = GLASS_LEVELS[level]

  return glass === false ? false : { ...glass }
}

/** The whole look for a variant: the palette, its backdrop, its rows and, where it has one, its sound. */
export function lookOf(
  variant: Variant,
  withSound: boolean,
  withStyle: boolean,
  glass: GlassLevel = DEFAULT_GLASS,
  text: TextBacking = DEFAULT_TEXT,
  bubble: UserBubble = DEFAULT_BUBBLE,
  tool: ToolRow = DEFAULT_TOOL,
): ThemeSetArgs {
  return {
    colors: COLORS,
    overrideColorScheme: 'dark',
    backdrop:
      variant.scene === undefined
        ? { color: '#000000' }
        : { scene: variant.id, glass: glassOf(glass) },
    ...(withStyle && { style: styleOf(variant, text, bubble, tool) }),
    ...(withSound && variant.sound !== undefined && { sound: variant.sound }),
  }
}

/**
 * Sets a variant's look. An older build refuses a whole look that names `sound` or `style`,
 * so it is asked again without the sound, then without the style too.
 */
async function setLook($: EngineInterface, variant: Variant): Promise<ThemeResult> {
  const glass = await storedGlass($)
  const text = await storedText($)
  const bubble = await storedBubble($)
  const tool = await storedTool($)
  let failure: unknown

  if (variant.sound !== undefined) {
    try {
      return await $.theme.set(lookOf(variant, true, true, glass, text, bubble, tool))
    } catch (error) {
      failure = error
    }
  }

  try {
    return await $.theme.set(lookOf(variant, false, true, glass, text, bubble, tool))
  } catch (error) {
    failure ??= error
  }

  try {
    return await $.theme.set(lookOf(variant, false, false, glass, text, bubble, tool))
  } catch (error) {
    throw failure ?? error
  }
}

/** How see-through the panels are: the stored level, else the default. A store that fails counts as none. */
async function storedGlass($: EngineInterface): Promise<GlassLevel> {
  try {
    const stored = await $.store.get(GLASS_KEY)

    return isGlassLevel(stored) ? stored : DEFAULT_GLASS
  } catch {
    return DEFAULT_GLASS
  }
}

/** Keeps a glass level and puts the look showing on again with it. */
async function setGlass($: EngineInterface, level: GlassLevel): Promise<string> {
  try {
    await $.store.set(GLASS_KEY, level)
  } catch (error) {
    return `The panel glass could not be saved: ${reasonOf(error)}`
  }

  await update($, panelGlass, () => level)

  const now = await read($, applied)
  const variant = now === null ? undefined : variantNamed(now)
  const said = `Panels are now ${level}: ${GLASS_NOTES[level]}.`

  if (variant === undefined) {
    return `${said} It shows once a look is on.`
  }

  if (variant.scene === undefined) {
    return `${said} ${variant.title} has no scene to see through, so it shows with the other looks.`
  }

  try {
    await setLook($, variant)
  } catch (error) {
    return `${said} The look could not be set again: ${reasonOf(error)}`
  }

  return said
}

/** What sits behind a reply's words: the stored kind, else the default. A store that fails counts as none. */
async function storedText($: EngineInterface): Promise<TextBacking> {
  try {
    const stored = await $.store.get(TEXT_KEY)

    return isTextBacking(stored) ? stored : DEFAULT_TEXT
  } catch {
    return DEFAULT_TEXT
  }
}

/** Keeps a text backing and puts the look showing on again with it. */
async function setText($: EngineInterface, backing: TextBacking): Promise<string> {
  try {
    await $.store.set(TEXT_KEY, backing)
  } catch (error) {
    return `The text backing could not be saved: ${reasonOf(error)}`
  }

  await update($, textBacking, () => backing)

  const now = await read($, applied)
  const variant = now === null ? undefined : variantNamed(now)
  const said = `Reply text now has ${backing}: ${TEXT_NOTES[backing]}.`

  if (variant === undefined) {
    return `${said} It shows once a look is on.`
  }

  try {
    await setLook($, variant)
  } catch (error) {
    return `${said} The look could not be set again: ${reasonOf(error)}`
  }

  return said
}

/** How your own messages look: the stored kind, else the default. A store that fails counts as none. */
async function storedBubble($: EngineInterface): Promise<UserBubble> {
  try {
    const stored = await $.store.get(BUBBLE_KEY)

    return isUserBubble(stored) ? stored : DEFAULT_BUBBLE
  } catch {
    return DEFAULT_BUBBLE
  }
}

/** Keeps a bubble kind and puts the look showing on again with it. */
async function setBubble($: EngineInterface, bubble: UserBubble): Promise<string> {
  try {
    await $.store.set(BUBBLE_KEY, bubble)
  } catch (error) {
    return `The bubble could not be saved: ${reasonOf(error)}`
  }

  await update($, userBubble, () => bubble)

  const now = await read($, applied)
  const variant = now === null ? undefined : variantNamed(now)
  const said = `Your messages now use ${bubble}: ${BUBBLE_NOTES[bubble]}.`

  if (variant === undefined) {
    return `${said} It shows once a look is on.`
  }

  try {
    await setLook($, variant)
  } catch (error) {
    return `${said} The look could not be set again: ${reasonOf(error)}`
  }

  return said
}

/** How tool call rows look: the stored kind, else the default. A store that fails counts as none. */
async function storedTool($: EngineInterface): Promise<ToolRow> {
  try {
    const stored = await $.store.get(TOOL_KEY)

    return isToolRow(stored) ? stored : DEFAULT_TOOL
  } catch {
    return DEFAULT_TOOL
  }
}

/** Keeps a tool row kind and puts the look showing on again with it. */
async function setTool($: EngineInterface, tool: ToolRow): Promise<string> {
  try {
    await $.store.set(TOOL_KEY, tool)
  } catch (error) {
    return `The tool row look could not be saved: ${reasonOf(error)}`
  }

  await update($, toolRow, () => tool)

  const now = await read($, applied)
  const variant = now === null ? undefined : variantNamed(now)
  const said = `Tool rows now use ${tool}: ${TOOL_NOTES[tool]}.`

  if (variant === undefined) {
    return `${said} It shows once a look is on.`
  }

  try {
    await setLook($, variant)
  } catch (error) {
    return `${said} The look could not be set again: ${reasonOf(error)}`
  }

  return said
}

/** The variant the store holds, the default where it holds none, or OFF. */
async function storedChoice($: EngineInterface): Promise<Variant | typeof OFF> {
  const stored = await $.store.get(CHOICE_KEY)

  if (stored === OFF) return OFF

  const found = typeof stored === 'string' ? variantNamed(stored) : undefined

  return found ?? variantNamed(DEFAULT_VARIANT) ?? (VARIANTS[0] as Variant)
}

/** Puts a variant on and keeps it as the choice. Answers what to tell the person. */
async function pick($: EngineInterface, variant: Variant): Promise<string> {
  let set: ThemeResult

  try {
    set = await setLook($, variant)
  } catch (error) {
    return `${variant.title} could not be applied: ${reasonOf(error)}`
  }

  await update($, applied, () => variant.id)

  try {
    await $.store.set(CHOICE_KEY, variant.id)
  } catch (error) {
    return `${variant.title} is on for now, but the choice could not be saved: ${reasonOf(error)}`
  }

  const sound = variant.sound === undefined ? '' : ' Press the speaker in the title bar to hear it.'
  const unshown = set.isDrawn ? '' : ` This window may not draw themes (${set.reason}).`

  return `${variant.title} is on. ${variant.blurb}${sound}${unshown}`
}

async function turnOff($: EngineInterface): Promise<string> {
  try {
    await $.theme.clear()
    await $.store.set(CHOICE_KEY, OFF)
  } catch (error) {
    return `OLED Noir could not be turned off: ${reasonOf(error)}`
  }

  await update($, applied, () => null)

  return `OLED Noir is off. /${COMMAND} brings it back.`
}

/** The variant after the one showing, round again after the last. */
async function nextVariant($: EngineInterface): Promise<Variant> {
  const now = await read($, applied)
  const index = VARIANTS.findIndex(variant => variant.id === now)

  return VARIANTS[(index + 1) % VARIANTS.length] as Variant
}

export function listText(): string {
  return [
    `OLED Noir has ${VARIANTS.length} looks:`,
    ...VARIANTS.map(variant => `  ${variant.id}: ${variant.blurb}`),
    `/${COMMAND} <name> puts one on, /${COMMAND} next steps to the next, /${COMMAND} off turns it off.`,
    `/${COMMAND} glass lists the kinds of panel glass, /${COMMAND} glass <kind> picks one, /${COMMAND} glass next steps through them.`,
    `/${COMMAND} text lists what can sit behind reply text, /${COMMAND} text <kind> picks one, /${COMMAND} text next steps through them.`,
    `/${COMMAND} bubble lists the looks for your own messages, /${COMMAND} bubble <kind> picks one, /${COMMAND} bubble next steps through them.`,
    `/${COMMAND} tools lists the looks for tool call rows, /${COMMAND} tools <kind> picks one, /${COMMAND} tools next steps through them.`,
    `/${COMMAND} stars lists how thick Starfall's shower grows, /${COMMAND} stars <kind> picks one, /${COMMAND} stars next steps through them.`,
  ].join('\n')
}

function toolList(now: ToolRow): string {
  return [
    `Tool call rows (now ${now}):`,
    ...TOOL_ORDER.map(tool => `  ${tool === now ? '✓' : ' '} ${tool}: ${TOOL_NOTES[tool]}`),
    `/${COMMAND} tools <kind> picks one, /${COMMAND} tools next steps to the next.`,
  ].join('\n')
}

function bubbleList(now: UserBubble): string {
  return [
    `Your own messages (now ${now}):`,
    ...BUBBLE_ORDER.map(bubble => `  ${bubble === now ? '✓' : ' '} ${bubble}: ${BUBBLE_NOTES[bubble]}`),
    `/${COMMAND} bubble <kind> picks one, /${COMMAND} bubble next steps to the next.`,
  ].join('\n')
}

function textList(now: TextBacking): string {
  return [
    `Behind reply text, from a solid box to nothing (now ${now}):`,
    ...TEXT_ORDER.map(backing => `  ${backing === now ? '✓' : ' '} ${backing}: ${TEXT_NOTES[backing]}`),
    `/${COMMAND} text <kind> picks one, /${COMMAND} text next steps to the next.`,
  ].join('\n')
}

function glassList(now: GlassLevel): string {
  return [
    `Panel glass, from most see-through to solid (now ${now}):`,
    ...GLASS_ORDER.map(level => `  ${level === now ? '✓' : ' '} ${level}: ${GLASS_NOTES[level]}`),
    `/${COMMAND} glass <kind> picks one, /${COMMAND} glass next steps to the next.`,
  ].join('\n')
}

/** What /noir answers: the card, the list, off, next, or a look by name. */
async function runCommand($: EngineInterface, args: string): Promise<string> {
  const name = args.trim()
  const key = keyOf(name)

  if (key === '') {
    await update($, isCardOpen, () => true)

    return 'Pick a look on the card above the prompt. Try as many as you like, then Close.'
  }

  if (key === 'list') return listText()
  if (key === 'off') return turnOff($)
  if (key === 'next') return pick($, await nextVariant($))

  if (key === 'glass' || key.startsWith('glass-')) {
    const level = key.slice('glass-'.length)
    const now = await storedGlass($)

    if (level === 'next') {
      return setGlass($, GLASS_ORDER[(GLASS_ORDER.indexOf(now) + 1) % GLASS_ORDER.length] ?? DEFAULT_GLASS)
    }

    if (isGlassLevel(level)) return setGlass($, level)

    return level === '' ? glassList(now) : `No glass named "${level}". ${glassList(now)}`
  }

  if (key === 'text' || key.startsWith('text-')) {
    const backing = key.slice('text-'.length)
    const now = await storedText($)

    if (backing === 'next') {
      return setText($, TEXT_ORDER[(TEXT_ORDER.indexOf(now) + 1) % TEXT_ORDER.length] ?? DEFAULT_TEXT)
    }

    if (isTextBacking(backing)) return setText($, backing)

    return backing === '' ? textList(now) : `No text backing named "${backing}". ${textList(now)}`
  }

  if (key === 'bubble' || key.startsWith('bubble-')) {
    const bubble = key.slice('bubble-'.length)
    const now = await storedBubble($)

    if (bubble === 'next') {
      return setBubble($, BUBBLE_ORDER[(BUBBLE_ORDER.indexOf(now) + 1) % BUBBLE_ORDER.length] ?? DEFAULT_BUBBLE)
    }

    if (isUserBubble(bubble)) return setBubble($, bubble)

    return bubble === '' ? bubbleList(now) : `No bubble named "${bubble}". ${bubbleList(now)}`
  }

  if (key === 'tools' || key.startsWith('tools-') || key === 'tool' || key.startsWith('tool-')) {
    const tool = key.replace(/^tools?-?/, '')
    const now = await storedTool($)

    if (tool === 'next') {
      return setTool($, TOOL_ORDER[(TOOL_ORDER.indexOf(now) + 1) % TOOL_ORDER.length] ?? DEFAULT_TOOL)
    }

    if (isToolRow(tool)) return setTool($, tool)

    return tool === '' ? toolList(now) : `No tool row named "${tool}". ${toolList(now)}`
  }

  if (key === 'stars' || key.startsWith('stars-') || key === 'star' || key.startsWith('star-')) {
    const stars = key.replace(/^stars?-?/, '')
    const now = await storedStars($)

    if (stars === 'next') {
      return setStars($, STAR_ORDER[(STAR_ORDER.indexOf(now) + 1) % STAR_ORDER.length] ?? DEFAULT_STARS)
    }

    if (isStarDensity(stars)) return setStars($, stars)

    return stars === '' ? starsList(now) : `No star density named "${stars}". ${starsList(now)}`
  }

  const variant = variantNamed(name)

  return variant === undefined ? `No look named "${name}". ${listText()}` : pick($, variant)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await $.command.register({
        name: COMMAND,
        description: 'Pick an OLED black look. Add a name to apply it, "next", "list" or "off".',
      })
    } catch (error) {
      void $.ui.toast(`oled-noir: /${COMMAND} is not available (${reasonOf(error)})`)
    }

    if (UNPAINTED !== undefined) {
      void $.ui.toast(UNPAINTED)
    }

    density = await storedStars($)
    sentValues = liveValues()

    try {
      const choice = await storedChoice($)

      if (choice !== OFF) {
        await setLook($, choice)
        await update($, applied, () => choice.id)
      }
    } catch (error) {
      await $.ui.log(`could not set its look (${reasonOf(error)})`)
    }

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    try {
      return { text: await runCommand($, e.args) }
    } catch (error) {
      return { text: `/${COMMAND} failed: ${reasonOf(error)}` }
    }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.props.plugin !== PLUGIN || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }

    const variant = VARIANTS.find(one => one.id === e.props.scene)
    const source = variant === undefined ? undefined : sceneSource(variant)

    if (variant === undefined || source === undefined) {
      return next(e)
    }

    const { Svg, Shader } = $.ui.resolve(e)
    const scene = <Svg isInteractive alt={`${variant.title}: ${variant.blurb}`} source={source} />

    isLiveDrawn = variant.isLive === true

    if (!isLiveDrawn) return scene

    sentValues = liveValues()

    return (
      <Shader module="./starfall.ts" values={sentValues}>
        {scene}
      </Shader>
    )
  })

  on('turn.start', ($, e, next) => {
    runningTurns.add(e.turnId)
    sendValues($)

    return next(e)
  })

  on('turn.step', async function* ($, e, next) {
    const startedAt = await $.clock.now()
    let tokens = 0

    for await (const chunk of next(e)) {
      if (chunk.kind === 'text' || chunk.kind === 'thinking') tokens += chunk.text.length / 4
      else if (chunk.kind === 'input') tokens += chunk.json.length / 4

      yield chunk
    }

    const seconds = ((await $.clock.now()) - startedAt) / 1000

    if (seconds > 0.5) {
      lastPace = tokens / seconds
      sendValues($)
    }
  })

  on('turn.complete', ($, e, next) => {
    runningTurns.delete(e.turnId)

    if (runningTurns.size === 0) lastPace = 0

    sendValues($)

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!(await read($, isCardOpen))) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    const now = await read($, applied)
    const keptGlass = await read($, panelGlass)
    const glass = isGlassLevel(keptGlass) ? keptGlass : await storedGlass($)
    const keptText = await read($, textBacking)
    const text = isTextBacking(keptText) ? keptText : await storedText($)
    const keptBubble = await read($, userBubble)
    const bubble = isUserBubble(keptBubble) ? keptBubble : await storedBubble($)
    const keptTool = await read($, toolRow)
    const tool = isToolRow(keptTool) ? keptTool : await storedTool($)
    const keptStars = await read($, starDensity)
    const stars = isStarDensity(keptStars) ? keptStars : await storedStars($)

    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1} gap="md">
        <Box flexDirection="row" gap={1}>
          <Text bold>OLED Noir</Text>
          <Button
            key="off"
            label={now === null ? 'Is off' : 'Turn off'}
            onPress={async () => {
              void $.ui.toast(await turnOff($))
            }}
          >
            {now === null ? 'Is off' : 'Turn off'}
          </Button>
          <Button key="close" label="Close" role="dismiss" onPress={() => update($, isCardOpen, () => false)}>
            Close
          </Button>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>Panels</Text>
          {GLASS_ORDER.map(level => {
            const word = glass === level ? `✓ ${glassWord(level)}` : glassWord(level)

            return (
              <Button
                key={`glass-${level}`}
                label={word}
                onPress={async () => {
                  const said = await setGlass($, level)

                  if (!said.startsWith('Panels are now') || said.includes('could not')) {
                    void $.ui.toast(said)
                  }
                }}
              >
                {word}
              </Button>
            )
          })}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>Text</Text>
          {TEXT_ORDER.map(backing => {
            const word = backing.charAt(0).toUpperCase() + backing.slice(1)
            const shown = text === backing ? `✓ ${word}` : word

            return (
              <Button
                key={`text-${backing}`}
                label={shown}
                onPress={async () => {
                  const said = await setText($, backing)

                  if (!said.startsWith('Reply text now has') || said.includes('could not')) {
                    void $.ui.toast(said)
                  }
                }}
              >
                {shown}
              </Button>
            )
          })}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>You</Text>
          {BUBBLE_ORDER.map(kind => {
            const word = kind.charAt(0).toUpperCase() + kind.slice(1)
            const shown = bubble === kind ? `✓ ${word}` : word

            return (
              <Button
                key={`bubble-${kind}`}
                label={shown}
                onPress={async () => {
                  const said = await setBubble($, kind)

                  if (!said.startsWith('Your messages now use') || said.includes('could not')) {
                    void $.ui.toast(said)
                  }
                }}
              >
                {shown}
              </Button>
            )
          })}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>Tools</Text>
          {TOOL_ORDER.map(kind => {
            const word = kind.charAt(0).toUpperCase() + kind.slice(1)
            const shown = tool === kind ? `✓ ${word}` : word

            return (
              <Button
                key={`tools-${kind}`}
                label={shown}
                onPress={async () => {
                  const said = await setTool($, kind)

                  if (!said.startsWith('Tool rows now use') || said.includes('could not')) {
                    void $.ui.toast(said)
                  }
                }}
              >
                {shown}
              </Button>
            )
          })}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap={1}>
          <Text dimColor>Starfall</Text>
          {STAR_ORDER.map(kind => {
            const word = kind.charAt(0).toUpperCase() + kind.slice(1)
            const shown = stars === kind ? `✓ ${word}` : word

            return (
              <Button
                key={`stars-${kind}`}
                label={shown}
                onPress={async () => {
                  const said = await setStars($, kind)

                  if (!said.startsWith('Starfall now falls') || said.includes('could not')) {
                    void $.ui.toast(said)
                  }
                }}
              >
                {shown}
              </Button>
            )
          })}
        </Box>
        {VARIANTS.map(variant => {
          const isOn = now === variant.id
          const word = isOn ? 'On' : 'Try'

          return (
            <Box key={`row-${variant.id}`} flexDirection="column" gap="xs">
              <Box flexDirection="row" flexWrap="wrap" justifyContent="space-between" columnGap="md" rowGap="xs">
                <Text bold={isOn}>
                  {isOn ? '✓ ' : ''}
                  {variant.title}
                </Text>
                <Button
                  key={`try-${variant.id}`}
                  label={word}
                  onPress={async () => {
                    const said = await pick($, variant)

                    if (!said.startsWith(`${variant.title} is on.`)) {
                      void $.ui.toast(said)
                    }
                  }}
                >
                  {word}
                </Button>
              </Box>
              <Text dimColor>{variant.blurb}</Text>
            </Box>
          )
        })}
      </Box>
    )
  })
}
