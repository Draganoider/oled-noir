import { expect, test } from 'claude-code/testing'
import type { ThemeSetArgs } from 'claude-code'

import { listText, lookOf, sceneSource } from './register'
import { GLASS_LEVELS, TEXT_BACKINGS, TOOL_ROWS, USER_BUBBLES, VARIANTS } from './variants'

test('every scene is a whole, pure-vector SVG the engine takes', () => {
  for (const variant of VARIANTS) {
    const source = sceneSource(variant)

    if (variant.id === 'void') {
      expect(source).toBeUndefined()
      continue
    }

    expect(source).toBeDefined()
    const svg = source ?? ''

    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000"')
    expect(svg).toEndWith('</svg>')
    expect(svg.length).toBeLessThan(131072)
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('href')
    expect(svg).not.toContain('CDATA')
    expect(svg).not.toContain('<!--')
    expect(svg).not.toContain('NaN')
    expect(svg).not.toContain('undefined')
    expect(svg).toContain('prefers-reduced-motion')
    // Every id holds a hyphen, so the desktop app keeps it.
    for (const match of svg.matchAll(/ id="([^"]+)"/g)) {
      expect(match[1]).toContain('-')
    }
  }
})

test('the look is true black and dark, with a scene or a black ground', () => {
  for (const variant of VARIANTS) {
    const look = lookOf(variant, true, true)

    expect(look.overrideColorScheme).toBe('dark')
    expect(look.colors?.inputs.light).toBeUndefined()
    expect(look.colors?.inputs.dark).toBeDefined()
    expect(look.backdrop).toEqual(
      variant.scene === undefined ? { color: '#000000' } : { scene: variant.id, glass: GLASS_LEVELS.bare },
    )
  }
})

test('the original frosted glass is kept, and the kinds run from none to solid', () => {
  expect(GLASS_LEVELS.frosted).toEqual({ blur: 14, tint: '#000000', opacity: 0.74 })
  expect(Object.keys(GLASS_LEVELS)[0]).toBe('none')
  expect(GLASS_LEVELS.none).toBe(false)
  expect(Object.keys(GLASS_LEVELS).at(-1)).toBe('solid')
})

test('reply text sits on soft smoke by default, and only the solid box names a text color', () => {
  const eclipse = VARIANTS.find(variant => variant.id === 'eclipse')!
  const soft = lookOf(eclipse, false, true).style

  expect(soft?.AssistantMessage).toEqual({ paddingX: 6, ...TEXT_BACKINGS.soft })
  expect(soft?.Heading?.color).toBeUndefined()
  expect(soft?.Heading?.fontFamily).toEqual(['serif'])

  const black = lookOf(eclipse, false, true, 'bare', 'black').style

  expect(black?.AssistantMessage).toEqual({ paddingX: 6, color: '#e9e9e9', backgroundColor: '#000000', radius: 8 })
  expect(black?.Heading?.color).toBe('#ffffff')

  const none = lookOf(eclipse, false, true, 'bare', 'none').style

  expect(none?.AssistantMessage).toEqual({ paddingX: 6 })
})

test('every see-through backing fades out with a shadow inside the allowed range', () => {
  for (const [name, rule] of Object.entries(TEXT_BACKINGS)) {
    if (name === 'black' || name === 'none') continue

    expect('shadow' in rule && rule.shadow.blur).toBeLessThanOrEqual(32)
    expect('backgroundColor' in rule && rule.backgroundColor).toMatch(/^#000000[0-9a-f]{2}$/)
  }
})

test('your messages keep the outline bubble by default, and each kind reaches the theme', () => {
  const eclipse = VARIANTS.find(variant => variant.id === 'eclipse')!

  expect(lookOf(eclipse, false, true).style?.UserMessage).toEqual({
    paddingX: 14,
    paddingY: 10,
    color: '#f2f2f2',
    backgroundColor: '#000000',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    radius: 14,
  })

  for (const [name, rule] of Object.entries(USER_BUBBLES)) {
    const look = lookOf(eclipse, false, true, 'bare', 'soft', name as keyof typeof USER_BUBBLES)

    expect(look.style?.UserMessage).toEqual({ paddingX: 14, paddingY: 10, ...rule })
  }
})

test('tool rows keep the original card by default, and each kind reaches the theme', () => {
  const eclipse = VARIANTS.find(variant => variant.id === 'eclipse')!

  expect(lookOf(eclipse, false, true).style?.ToolUse).toEqual({
    paddingX: 8,
    color: '#b8b8b8',
    backgroundColor: '#050505',
    borderColor: '#1e1e1e',
    radius: 8,
    fontFamily: ['code'],
  })

  for (const [name, rule] of Object.entries(TOOL_ROWS)) {
    const look = lookOf(eclipse, false, true, 'bare', 'soft', 'outline', name as keyof typeof TOOL_ROWS)

    expect(look.style?.ToolUse).toEqual(name === 'none' ? {} : { paddingX: 8, ...rule })
  }
})

test('no glass reaches the theme as false', () => {
  const variant = VARIANTS[0]

  expect(variant).toBeDefined()
  expect(lookOf(variant ?? VARIANTS[0]!, false, true, 'none').backdrop).toEqual({ scene: 'eclipse', glass: false })
})

test('a stored glass level is used, and an unknown one falls back to bare', async ($, on) => {
  const sets: ThemeSetArgs[] = []
  let glass: unknown = 'smoke'

  on('command.register', () => ({ value: { command: 'noir' } }))
  on('store.get', (_, e) => ({ value: e.key === 'glass' ? glass : 'deep-field' }))
  on('theme.set', (_, e) => {
    sets.push(e)

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  glass = 'see-through-ish'
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(sets.map(set => set.backdrop)).toEqual([
    { scene: 'deep-field', glass: GLASS_LEVELS.smoke },
    { scene: 'deep-field', glass: GLASS_LEVELS.bare },
  ])
})

test('the session starts on Deep Field with bare glass when nothing was chosen', async ($, on) => {
  const sets: ThemeSetArgs[] = []

  on('command.register', () => ({ value: { command: 'noir' } }))
  on('store.get', () => ({ value: undefined }))
  on('theme.set', (_, e) => {
    sets.push(e)

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect(sets).toHaveLength(1)
  expect(sets[0]?.backdrop).toEqual({ scene: 'deep-field', glass: GLASS_LEVELS.bare })
  expect(sets[0]?.style?.UserMessage).toBeDefined()
})

test('the list names every look', () => {
  const text = listText()

  for (const variant of VARIANTS) {
    expect(text).toContain(`${variant.id}:`)
  }
})

test('the backdrop draws the scene the theme names', async ($) => {
  const ui = await $.ui.mount({
    plugin: 'oled-noir',
    component: 'Backdrop',
    requestId: 'backdrop',
    surface: 'desktop',
    props: { scene: 'murmuration', plugin: 'oled-noir', glass: false },
  })

  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})
