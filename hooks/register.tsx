import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeResult, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { DEFAULT_VARIANT, VARIANTS, keyOf, styleOf, variantNamed } from './variants'
import type { Variant } from './variants'

const PLUGIN = 'oled-noir'
const COMMAND = 'noir'
// One choice for every session and project: the look is yours, not the project's.
const CHOICE_KEY = 'variant'
const OFF = 'off'

const isCardOpen = atom({ plugin: 'oled-noir', key: 'isCardOpen' } as const, false)
const applied = atom({ plugin: 'oled-noir', key: 'applied' } as const, null)

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

function reasonOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** The whole look for a variant: the palette, its backdrop, its rows and, where it has one, its sound. */
export function lookOf(variant: Variant, withSound: boolean, withStyle: boolean): ThemeSetArgs {
  return {
    colors: COLORS,
    overrideColorScheme: 'dark',
    backdrop:
      variant.scene === undefined
        ? { color: '#000000' }
        : { scene: variant.id, glass: variant.glass ?? false },
    ...(withStyle && { style: styleOf(variant) }),
    ...(withSound && variant.sound !== undefined && { sound: variant.sound }),
  }
}

/**
 * Sets a variant's look. An older build refuses a whole look that names `sound` or `style`,
 * so it is asked again without the sound, then without the style too.
 */
async function setLook($: EngineInterface, variant: Variant): Promise<ThemeResult> {
  let failure: unknown

  if (variant.sound !== undefined) {
    try {
      return await $.theme.set(lookOf(variant, true, true))
    } catch (error) {
      failure = error
    }
  }

  try {
    return await $.theme.set(lookOf(variant, false, true))
  } catch (error) {
    failure ??= error
  }

  try {
    return await $.theme.set(lookOf(variant, false, false))
  } catch (error) {
    throw failure ?? error
  }
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

    const { Svg } = $.ui.resolve(e)

    return <Svg isInteractive alt={`${variant.title}: ${variant.blurb}`} source={source} />
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!(await read($, isCardOpen))) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    const now = await read($, applied)

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
