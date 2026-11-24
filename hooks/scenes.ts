// Black and white scenes made for OLED screens: a true black ground, white light, slow motion.
// Every scene keeps most of its pixels off, keeps its subject in the margins, and keeps moving,
// so no bright shape sits still on one spot of the panel for hours.
// Pure string building: no DOM, nothing from outside this file. Every id holds a hyphen.

type Rand = () => number

/** A repeatable random stream: every build draws the same scene. */
function rng(seed: number): Rand {
  let a = seed >>> 0

  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A number with one decimal, as short as it can be written. */
function n(value: number): string {
  return String(Math.round(value * 10) / 10)
}

/** A gray from 0 (black) to 255 (white). */
function gray(level: number): string {
  const hex = Math.max(0, Math.min(255, Math.round(level)))
    .toString(16)
    .padStart(2, '0')

  return `#${hex}${hex}${hex}`
}

/** A rough bell curve around 0 with a spread of 1. */
function bell(rand: Rand): number {
  return (rand() + rand() + rand() + rand() - 2) * 1.7
}

const STILL = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'

function frame(css: string, body: string, defs = ''): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">' +
    (defs === '' ? '' : `<defs>${defs}</defs>`) +
    `<style>${css}${STILL}</style>` +
    '<rect width="1600" height="1000" fill="#000"/>' +
    body +
    '</svg>'
  )
}

const TWINKLE_CSS =
  '.tw-a{animation:tw-k 5.5s ease-in-out infinite}' +
  '.tw-b{animation:tw-k 7.5s ease-in-out -2s infinite}' +
  '.tw-c{animation:tw-k 11s ease-in-out -5s infinite}' +
  '@keyframes tw-k{0%,100%{opacity:1}50%{opacity:.3}}'

type StarOptions = {
  count: number
  seed: number
  maxRadius?: number
  dimmest?: number
  area?: { x0: number; x1: number; y0: number; y1: number }
  avoid?: (x: number, y: number) => boolean
}

/** Stars in four groups: one still and three that twinkle out of step. */
function stars(options: StarOptions): string {
  const rand = rng(options.seed)
  const area = options.area ?? { x0: 0, x1: 1600, y0: 0, y1: 1000 }
  const groups: string[][] = [[], [], [], []]
  let placed = 0

  for (let tries = 0; placed < options.count && tries < options.count * 30; tries += 1) {
    const x = area.x0 + rand() * (area.x1 - area.x0)
    const y = area.y0 + rand() * (area.y1 - area.y0)

    if (options.avoid?.(x, y) === true) continue

    const bright = rand()
    const radius = 0.5 + bright ** 3 * (options.maxRadius ?? 1.9)
    const level = (options.dimmest ?? 90) + bright * (255 - (options.dimmest ?? 90))

    groups[Math.floor(rand() * 4)]?.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${gray(level)}"/>`,
    )
    placed += 1
  }

  const [still = [], a = [], b = [], c = []] = groups

  return (
    `<g>${still.join('')}</g><g class="tw-a">${a.join('')}</g>` +
    `<g class="tw-b">${b.join('')}</g><g class="tw-c">${c.join('')}</g>`
  )
}

// ---------------------------------------------------------------- Eclipse

/** A total eclipse in the top right corner: a black sun in a slowly turning white corona. */
export function eclipseSvg(): string {
  const cx = 1250
  const cy = 235
  const radius = 92
  const rand = rng(7)

  const rays = (count: number, reach: number, widest: number): string => {
    let out = ''

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.08
      // Long streamers east and west, short plumes at the poles, as the corona looks near a solar minimum.
      const equator = Math.abs(Math.cos(angle)) ** 1.5
      const length = 25 + rand() * 60 + equator * (reach * 0.4 + rand() * reach)
      const start = radius + 2

      out +=
        `<path d="M${n(Math.cos(angle) * start)} ${n(Math.sin(angle) * start)}` +
        `L${n(Math.cos(angle) * (start + length))} ${n(Math.sin(angle) * (start + length))}"` +
        ` stroke-width="${n(0.4 + rand() * widest)}"/>`
    }

    return out
  }

  const beadAngle = -2.25
  const beadX = Math.cos(beadAngle) * (radius + 1)
  const beadY = Math.sin(beadAngle) * (radius + 1)

  const defs =
    '<radialGradient id="ec-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="430">' +
    '<stop offset=".2" stop-color="#fff" stop-opacity=".95"/>' +
    '<stop offset=".42" stop-color="#fff" stop-opacity=".32"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ec-glow">' +
    '<stop offset=".27" stop-color="#fff" stop-opacity=".95"/>' +
    '<stop offset=".31" stop-color="#fff" stop-opacity=".5"/>' +
    '<stop offset=".4" stop-color="#fff" stop-opacity=".16"/>' +
    '<stop offset=".62" stop-color="#fff" stop-opacity=".04"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="ec-bead-glow">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="1"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'

  const css =
    TWINKLE_CSS +
    '.ec-spin{animation:ec-turn 300s linear infinite}' +
    '.ec-spin-back{animation:ec-turn 460s linear reverse infinite}' +
    '@keyframes ec-turn{to{transform:rotate(360deg)}}' +
    '.ec-breathe{animation:ec-br 10s ease-in-out infinite}' +
    '@keyframes ec-br{0%,100%{opacity:.8;transform:scale(1)}50%{opacity:1;transform:scale(1.045)}}' +
    '.ec-bead{opacity:0;animation:ec-bd 26s ease-in-out infinite}' +
    '@keyframes ec-bd{0%,76%,100%{opacity:0}86%{opacity:1}95%{opacity:0}}' +
    '@media (max-aspect-ratio: 3/2){.ec-pos{transform:translate(-110px,0)}}' +
    '@media (max-aspect-ratio: 1/1){.ec-pos{transform:translate(-330px,-20px)}}'

  const body =
    stars({ count: 150, seed: 11, avoid: (x, y) => Math.hypot(x - cx, y - cy) < 380 }) +
    `<g class="ec-pos"><g transform="translate(${cx} ${cy})">` +
    '<circle class="ec-breathe" r="330" fill="url(#ec-glow)"/>' +
    `<g class="ec-spin" stroke="url(#ec-fade)" stroke-linecap="round" fill="none">${rays(96, 260, 1.4)}</g>` +
    `<g class="ec-spin-back" stroke="url(#ec-fade)" stroke-linecap="round" fill="none" opacity=".55">${rays(70, 170, 0.8)}</g>` +
    `<circle r="${radius}" fill="#000"/>` +
    `<circle r="${n(radius + 0.8)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.4"/>` +
    `<g class="ec-bead"><circle cx="${n(beadX)}" cy="${n(beadY)}" r="16" fill="url(#ec-bead-glow)"/>` +
    `<circle cx="${n(beadX)}" cy="${n(beadY)}" r="2.6" fill="#fff"/></g>` +
    '</g></g>'

  return frame(css, body, defs)
}

// ---------------------------------------------------------------- Deep field

/** A deep sky: drifting stars at two depths, a slow spiral galaxy and the odd shooting star. */
export function deepFieldSvg(): string {
  return nightSky(true)
}

/** The same sky with no galaxy: only stars drifting at two depths, and a star falling now and then. */
export function starfieldSvg(): string {
  return nightSky(false)
}

/** The night sky Deep Field and Starfield share. Without the galaxy, a third shooting star crosses the open sky. */
function nightSky(withGalaxy: boolean): string {
  const rand = rng(23)
  const galaxyX = 1240
  const galaxyY = 700

  let arms = ''

  for (let arm = 0; arm < (withGalaxy ? 2 : 0); arm += 1) {
    for (let i = 0; i < 260; i += 1) {
      const theta = (i / 260) * Math.PI * 4.2
      const r = 8.5 * Math.exp(0.25 * theta)
      const spread = 3 + r * 0.14
      const angle = theta + arm * Math.PI
      const x = Math.cos(angle) * r + bell(rand) * spread
      const y = Math.sin(angle) * r + bell(rand) * spread
      const level = 235 - (r / 240) * 150 + (rand() - 0.5) * 50

      arms += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.6 + rand() * 0.9)}" fill="${gray(level)}"/>`
    }
  }

  const defs =
    '<radialGradient id="df-core">' +
    '<stop offset="0" stop-color="#fff" stop-opacity=".9"/>' +
    '<stop offset=".35" stop-color="#fff" stop-opacity=".25"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="df-tail" x1="1" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>'

  const css =
    TWINKLE_CSS +
    '.df-far{animation:df-dr 190s ease-in-out infinite alternate}' +
    '.df-near{animation:df-dr2 150s ease-in-out infinite alternate}' +
    '@keyframes df-dr{from{transform:translate(-28px,-6px)}to{transform:translate(28px,6px)}}' +
    '@keyframes df-dr2{from{transform:translate(-60px,-12px)}to{transform:translate(60px,12px)}}' +
    '.df-spin{animation:df-turn 420s linear infinite}' +
    '@keyframes df-turn{to{transform:rotate(-360deg)}}' +
    '.df-meteor-a,.df-meteor-b,.df-meteor-c{opacity:0}' +
    '.df-meteor-a{animation:df-fly 17s linear 3s infinite}' +
    '.df-meteor-b{animation:df-fly 29s linear 11s infinite}' +
    '.df-meteor-c{animation:df-fly 23s linear 7s infinite}' +
    '@keyframes df-fly{0%{opacity:0;transform:translate(0,0)}1.5%{opacity:1}' +
    '5%{opacity:0;transform:translate(-460px,290px)}100%{opacity:0;transform:translate(-460px,290px)}}'

  const meteor = (x: number, y: number, name: string): string =>
    `<g transform="translate(${x} ${y})"><g class="${name}">` +
    '<path d="M0 0L150 -95L151.5 -92.5Z" fill="url(#df-tail)"/>' +
    '<circle r="1.8" fill="#fff"/></g></g>'

  const body =
    `<g class="df-far">${stars({ count: 230, seed: 29, maxRadius: 1.1, dimmest: 60, area: { x0: -80, x1: 1680, y0: -30, y1: 1030 } })}</g>` +
    `<g class="df-near">${stars({ count: 36, seed: 31, maxRadius: 2.2, dimmest: 160, area: { x0: -100, x1: 1700, y0: -30, y1: 1030 } })}</g>` +
    (withGalaxy
      ? `<g transform="translate(${galaxyX} ${galaxyY}) rotate(-24) scale(1 .42)">` +
        `<g class="df-spin"><circle r="85" fill="url(#df-core)"/>${arms}</g></g>`
      : meteor(1560, 430, 'df-meteor-c')) +
    meteor(1450, 120, 'df-meteor-a') +
    meteor(820, 70, 'df-meteor-b')

  return frame(css, body, defs)
}

// ---------------------------------------------------------------- Oscilloscope

/** A phosphor oscilloscope: a turning Lissajous knot on the left, a running waveform top right. */
export function oscilloscopeSvg(): string {
  const cx = 345
  const cy = 480
  const size = 128
  const points: [number, number][] = []

  for (let i = 0; i <= 480; i += 1) {
    const t = (i / 480) * Math.PI * 2
    points.push([cx + size * Math.sin(3 * t + Math.PI / 4), cy + size * Math.sin(2 * t)])
  }

  let length = 0

  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1] ?? [0, 0]
    const [x1, y1] = points[i] ?? [0, 0]
    length += Math.hypot(x1 - x0, y1 - y0)
  }

  const knot = 'M' + points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')
  const trail = length * 0.3
  const head = length * 0.05

  // The running wave: two periods side by side, slid left by one period and round again.
  const period = 390
  let wave = ''

  for (let x = 0; x <= period * 2; x += 3) {
    const phase = (x / period) * Math.PI * 2
    const envelope = 0.55 + 0.45 * Math.sin(phase)
    const y = 170 + 36 * envelope * Math.sin(phase * 6) + 7 * Math.sin(phase * 17)
    wave += `${x === 0 ? 'M' : 'L'}${x} ${n(y)}`
  }

  let grid = ''

  for (let i = 0; i <= 10; i += 1) {
    const at = cx - 160 + i * 32
    const down = cy - 160 + i * 32
    grid += `<path d="M${at} ${cy - 160}V${cy + 160}M${cx - 160} ${down}H${cx + 160}"/>`
  }

  let ticks = ''

  for (let i = -25; i <= 25; i += 1) {
    const reach = i % 5 === 0 ? 5 : 2.5
    ticks += `<path d="M${cx + i * 6.4} ${cy - reach}V${cy + reach}M${cx - reach} ${cy + i * 6.4}H${cx + reach}"/>`
  }

  let waveGrid = ''

  for (let i = 0; i <= 13; i += 1) {
    waveGrid += `<path d="M${1060 + i * 30} 110V230"/>`
  }

  waveGrid += '<path d="M1060 110H1450M1060 170H1450M1060 230H1450"/>'

  const defs = '<clipPath id="os-clip"><rect x="1060" y="105" width="390" height="130"/></clipPath>'

  const css =
    `.os-turn{animation:os-tn 18s ease-in-out infinite;transform-origin:${cx}px ${cy}px}` +
    '@keyframes os-tn{0%,100%{transform:scaleX(1)}50%{transform:scaleX(-1)}}' +
    `.os-trail{stroke-dasharray:${n(trail)} ${n(length - trail)};animation:os-tr 7s linear infinite}` +
    `.os-head{stroke-dasharray:${n(head)} ${n(length - head)};stroke-dashoffset:${n(-(trail - head))};` +
    'animation:os-hd 7s linear infinite}' +
    `@keyframes os-tr{from{stroke-dashoffset:0}to{stroke-dashoffset:${n(-length)}}}` +
    `@keyframes os-hd{from{stroke-dashoffset:${n(-(trail - head))}}to{stroke-dashoffset:${n(-(trail - head) - length)}}}` +
    '.os-run{animation:os-rn 9s linear infinite}' +
    `@keyframes os-rn{from{transform:translateX(0)}to{transform:translateX(-${period}px)}}` +
    '.os-blink{animation:os-bl 4s steps(2,jump-none) infinite}' +
    '@keyframes os-bl{0%{opacity:1}100%{opacity:.25}}'

  const body =
    `<rect x="${cx - 176}" y="${cy - 176}" width="352" height="352" rx="22" fill="none" stroke="#1d1d1d" stroke-width="1.5"/>` +
    `<g stroke="#121212" stroke-width="1" fill="none">${grid}</g>` +
    `<g stroke="#2a2a2a" stroke-width="1" fill="none">${ticks}</g>` +
    `<g class="os-turn" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${knot}" stroke="#262626" stroke-width="1.1"/>` +
    `<path class="os-trail" d="${knot}" stroke="#fff" stroke-opacity=".28" stroke-width="1.8"/>` +
    `<path class="os-head" d="${knot}" stroke="#fff" stroke-width="2.3"/></g>` +
    `<g font-family="monospace" font-size="11" fill="#4a4a4a">` +
    `<text x="${cx - 168}" y="${cy + 198}">CH1 500mV/div</text>` +
    `<text x="${cx + 52}" y="${cy + 198}">X-Y  3:2</text>` +
    '<text x="1060" y="254">CH2 1V/div  2ms</text>' +
    `<circle class="os-blink" cx="${cx + 160}" cy="${cy - 192}" r="2.5" fill="#bbb"/>` +
    `<text x="${cx + 120}" y="${cy - 188}">RUN</text></g>` +
    `<g stroke="#121212" fill="none">${waveGrid}</g>` +
    '<g clip-path="url(#os-clip)"><g transform="translate(1060 0)"><g class="os-run" fill="none" stroke-linejoin="round">' +
    `<path d="${wave}" stroke="#fff" stroke-opacity=".22" stroke-width="3.5"/>` +
    `<path d="${wave}" stroke="#f2f2f2" stroke-width="1.4"/></g></g></g>`

  return frame(css, body, defs)
}

// ---------------------------------------------------------------- Night rain

/** Rain falling in the margins of a black window, rings spreading in puddles at the foot corners. */
export function nightRainSvg(): string {
  const rand = rng(41)
  const speeds = [2.8, 3.4, 4.1, 4.9, 5.8]
  const delays = 10
  let streaks = ''

  for (let i = 0; i < 120; i += 1) {
    const isLeft = i % 2 === 0
    const x = isLeft ? 10 + rand() * 400 : 1190 + rand() * 410
    const y = rand() * 1000
    const length = 26 + rand() * 70
    const speed = Math.floor(rand() * speeds.length)

    streaks +=
      `<g transform="translate(${n(x)} ${n(y)})"><g class="rn-f rn-s${speed} rn-d${Math.floor(rand() * delays)}">` +
      `<path d="M0 0L${n(-length * 0.06)} ${n(length)}" stroke-width="${n(0.7 + rand() * 0.9)}" stroke-opacity="${n(0.45 + rand() * 0.55)}"/></g></g>`
  }

  let rings = ''
  const puddles: [number, number][] = [
    [150, 940],
    [300, 965],
    [70, 975],
    [1330, 950],
    [1480, 930],
    [1545, 975],
  ]

  puddles.forEach(([x, y], index) => {
    for (let ring = 0; ring < 2; ring += 1) {
      rings +=
        `<g transform="translate(${x} ${y})"><ellipse class="rn-ring rn-r${(index * 2 + ring) % 6}" rx="46" ry="9"` +
        ' fill="none" stroke="#fff" stroke-width="1"/></g>'
    }
  })

  const defs =
    '<linearGradient id="rn-drop" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>'

  const css =
    '@keyframes rn-fall{from{transform:translate(70px,-1150px)}to{transform:translate(-70px,1150px)}}' +
    speeds.map((seconds, index) => `.rn-s${index}{animation:rn-fall ${seconds}s linear infinite}`).join('') +
    Array.from({ length: delays }, (_, index) => `.rn-d${index}{animation-delay:-${n(index * 0.61)}s}`).join('') +
    '.rn-ring{opacity:0;transform:scale(.1);animation:rn-sp 5.4s ease-out infinite}' +
    '@keyframes rn-sp{0%{opacity:.75;transform:scale(.08)}100%{opacity:0;transform:scale(1)}}' +
    Array.from({ length: 6 }, (_, index) => `.rn-r${index}{animation-delay:-${n(index * 0.9)}s}`).join('') +
    '@media (prefers-reduced-motion: reduce){.rn-ring{opacity:.3;transform:scale(.6)}}'

  const body =
    `<g stroke="url(#rn-drop)" stroke-linecap="round" fill="none">${streaks}</g>` +
    rings

  return frame(css, body, defs)
}

// ---------------------------------------------------------------- Topography

/** Contour lines of three hills, with a slow pulse running out from each summit like a sonar ping. */
export function topographySvg(): string {
  const rand = rng(53)
  const css: string[] = []
  let body = ''
  let ringIndex = 0

  const hill = (cx: number, cy: number, count: number, step: number, height: number, label: string): void => {
    const phases = [rand() * 6, rand() * 6, rand() * 6, rand() * 6]

    for (let i = 0; i < count; i += 1) {
      const base = 22 + i * step
      let d = ''

      for (let k = 0; k <= 120; k += 1) {
        const theta = (k / 120) * Math.PI * 2
        const wobble =
          0.13 * Math.sin(2 * theta + (phases[0] ?? 0) + i * 0.09) +
          0.08 * Math.sin(3 * theta + (phases[1] ?? 0) - i * 0.12) +
          0.05 * Math.sin(5 * theta + (phases[2] ?? 0) + i * 0.2) +
          0.025 * Math.sin(9 * theta + (phases[3] ?? 0) + i * 0.35)
        const r = base * (1 + wobble * Math.min(1, 0.4 + i * 0.08))
        d += `${k === 0 ? 'M' : 'L'}${n(cx + Math.cos(theta) * r)} ${n(cy + Math.sin(theta) * r)}`
      }

      const isIndex = i % 5 === 4
      body +=
        `<path class="tp-r tp-i${ringIndex}" d="${d}Z" stroke-opacity="${isIndex ? '.95' : '.5'}"` +
        ` stroke-width="${isIndex ? '1.3' : '.9'}"/>`
      css.push(`.tp-i${ringIndex}{animation-delay:${n(i * 0.34)}s}`)
      ringIndex += 1
    }

    body +=
      `<g font-family="monospace" font-size="11" fill="#5a5a5a" stroke="none">` +
      `<path d="M${cx} ${cy - 5}l4.5 8h-9Z" fill="#9a9a9a"/>` +
      `<text x="${cx + 9}" y="${cy + 4}">${height}</text>` +
      `<text x="${cx + 9}" y="${cy + 18}" fill="#3a3a3a">${label}</text></g>`
  }

  hill(170, 150, 17, 29, 2184, 'NOIR PEAK')
  hill(1470, 885, 14, 31, 1907, 'BLACK TOR')
  hill(1395, 170, 7, 24, 1236, 'CAIRN')

  // A faint survey grid, the way a map sheet has one.
  let sheet = ''

  for (let x = 100; x < 1600; x += 200) sheet += `<path d="M${x} 0V1000"/>`
  for (let y = 100; y < 1000; y += 200) sheet += `<path d="M0 ${y}H1600"/>`

  const style =
    '.tp-r{opacity:.3;animation:tp-p 11s ease-in-out infinite}' +
    '@keyframes tp-p{0%,100%{opacity:.3}7%{opacity:1}18%{opacity:.3}}' +
    css.join('')

  return frame(
    style,
    `<g stroke="#0e0e0e" fill="none">${sheet}</g><g stroke="#fff" fill="none" stroke-linejoin="round">${body}</g>`,
  )
}

// ---------------------------------------------------------------- Murmuration

/** A flock of starlings folding and stretching in the top right corner under a thin crescent moon. */
export function murmurationSvg(): string {
  const rand = rng(67)
  const restX = 1090
  const restY = 320
  const variants = 6
  const delays = 12
  const css: string[] = []

  for (let v = 0; v < variants; v += 1) {
    const scale = 0.62 + v * 0.13
    const tilt = (v - 2.5) * 0.07
    const frames: string[] = []

    for (let k = 0; k <= 12; k += 1) {
      const t = (k / 12) * Math.PI * 2
      const x0 = 230 * Math.sin(t) + 70 * Math.sin(2 * t + 0.4)
      const y0 = 120 * Math.sin(2 * t + 0.6) + 40 * Math.cos(t)
      const x = (x0 * Math.cos(tilt) - y0 * Math.sin(tilt)) * scale
      const y = (x0 * Math.sin(tilt) + y0 * Math.cos(tilt)) * scale
      frames.push(`${n((k / 12) * 100)}%{transform:translate(${n(x)}px,${n(y)}px)}`)
    }

    css.push(`@keyframes fl-k${v}{${frames.join('')}}.fl-p${v}{animation:fl-k${v} 44s linear infinite}`)
  }

  for (let d = 0; d < delays; d += 1) {
    css.push(`.fl-d${d}{animation-delay:-${n(d * 0.22)}s}`)
  }

  css.push(
    '.fl-b{transform-box:fill-box;transform-origin:50% 50%;animation:fl-flap .9s ease-in-out infinite alternate}',
    '.fl-b2{animation-duration:1.1s}.fl-b3{animation-duration:.75s}',
    '@keyframes fl-flap{from{transform:scaleY(1)}to{transform:scaleY(-.35)}}',
    '.fl-moon{animation:fl-glow 14s ease-in-out infinite}',
    '@keyframes fl-glow{0%,100%{opacity:.85}50%{opacity:1}}',
  )

  let birds = ''

  for (let i = 0; i < 130; i += 1) {
    const x = bell(rand) * 75
    const y = bell(rand) * 20
    const wing = 2.4 + rand() * 2
    const flap = ['', ' fl-b2', ' fl-b3'][Math.floor(rand() * 3)] ?? ''

    birds +=
      `<g class="fl-p${Math.floor(rand() * variants)} fl-d${Math.floor(rand() * delays)}">` +
      `<path class="fl-b${flap}" d="M${n(x - wing)} ${n(y - wing * 0.45)}l${n(wing)} ${n(wing * 0.65)}l${n(wing)} ${n(-wing * 0.65)}"/></g>`
  }

  const moon =
    '<g class="fl-moon" transform="translate(1340 115)">' +
    '<circle r="34" fill="#f2f2f2"/><circle cx="-12" cy="-7" r="32" fill="#000"/></g>'

  const body =
    stars({ count: 70, seed: 71, maxRadius: 1, dimmest: 50, avoid: (x, y) => y > 620 }) +
    moon +
    `<g transform="translate(${restX} ${restY})" stroke="#e8e8e8" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none">${birds}</g>`

  return frame(TWINKLE_CSS + css.join(''), body)
}
