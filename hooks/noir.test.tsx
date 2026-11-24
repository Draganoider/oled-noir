import { expect, test } from 'claude-code/testing'
import type { ThemeSetArgs } from 'claude-code'

import { listText, lookOf, sceneSource } from './register'
import { VARIANTS } from './variants'

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
      variant.scene === undefined ? { color: '#000000' } : { scene: variant.id, glass: variant.glass },
    )
  }
})

test('the session starts on Eclipse when nothing was chosen', async ($, on) => {
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
  expect(sets[0]?.backdrop).toEqual({ scene: 'eclipse', glass: VARIANTS[0]?.glass })
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
