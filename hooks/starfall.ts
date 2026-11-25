// Starfall's falling stars, drawn over the Starfield sky while Claude works.
//
// The mod sets five numbers. `working` is 1 while a turn runs. `pace` is how fast Claude last wrote, 0 to 1.
// `base`, `peak` and `ramp` come from the /noir stars setting: stars a second as work begins, stars a second
// at the height of it, and the seconds it takes to get there.
//
// The longer Claude works, the more stars fall: a one-texel buffer keeps the charge, rising over `ramp`
// seconds of work and falling away over about twelve once Claude stops, so the shower tapers off
// rather than snapping out. Nothing is counted in the mod: the charge piles up here, frame by frame.
//
// Each star is a thin strip drawn only where it is, 64 at most at once. Every slot has its own period;
// in each period it lights one star or none, by a fixed hash against the chance the rate gives.
//
// The app plays a shader at 60 frames a second at most. On a faster screen a star would step between
// frames, so each head is smeared along the ground it covered since the last frame, like a camera's blur.

import {
  buffer,
  clamp,
  composer,
  dt,
  exp,
  floor,
  fract,
  max,
  min,
  mix,
  normalize,
  picture,
  pow,
  shader,
  shapes,
  sin,
  size,
  smoothstep,
  step,
  still,
  time,
  values,
  vec2,
  vec4,
} from 'claude-code/shader'
import type { Buffer } from 'claude-code/shader'

const v = values({ working: [0, 1], pace: [0, 1], base: [0, 4], peak: [0, 20], ramp: [10, 600] })

const SLOTS = 64
/** How many slot periods begin each second, on average: SLOTS over the mean period of four seconds. */
const STARTS_PER_SECOND = 16
/** Half a strip's width, in points: room for the glow round the head. */
const HALF_WIDTH = 5

function hash(seed: number): number {
  return fract(sin(seed * 12.9898 + 78.233) * 43758.5453)
}

/** The charge, 0 to 1: how long Claude has been at it, against `ramp`. */
const charge: Buffer = buffer({ size: [1, 1], float: 16, filter: 'nearest' }, () => {
  const last = charge.at(vec2(0, 0)).x
  const rising = last + dt / v.ramp
  const falling = last - dt / 12

  return vec4(clamp(mix(falling, rising, v.working), 0, 1), 0, 0, 1)
})

// The stars are drawn straight onto the picture, added over it, with no buffer the size of the window:
// a 4K window costs only the strips the stars cover, and no texture has to reach its width.
const fall = shapes(
  // 64 strips of at most about 340 by 10 points cover under a quarter of a window together.
  { count: 4, instances: SLOTS, cover: 0.3, draw: 'strip', blend: 'add' },
  (vertex, slot) => {
    const build = charge.at(vec2(0, 0)).x
    const rate = mix(v.base * v.working, v.peak, pow(build, 1.4)) * (0.8 + 0.4 * v.pace)
    const chance = rate / STARTS_PER_SECOND

    const period = 3 + fract(slot * 0.618) * 2
    const shifted = time + slot * 2.9
    const cycle = floor(shifted / period)
    const age = shifted - cycle * period
    const seed = cycle * 7.31 + slot * 1.73
    const life = 1.2 + hash(seed + 2.1) * 0.8
    const done = age / life

    if (still > 0) return { hide: true }
    if (hash(seed) >= chance) return { hide: true }
    if (done > 1) return { hide: true }

    // Down and to the left, as Starfield's own shooting stars fall, each a little steeper or flatter.
    const way = vec2(normalize(vec2(-0.846 + (hash(seed + 5.3) - 0.5) * 0.25, -0.533)))
    const across = vec2(-way.y, way.x)
    const speed = 260 + hash(seed + 3.9) * 160
    const start = vec2(size.x * (0.05 + hash(seed + 0.5) * 1.15), size.y * (0.3 + hash(seed + 1.3) * 0.75))
    const head = vec2(start + way * speed * age)
    const tail = min(speed * age, 90 + hash(seed + 6.7) * 120) + 1
    const smear = speed * dt
    const fade = smoothstep(0, 0.1, done) * (1 - smoothstep(0.65, 1, done))

    // A strip from just ahead of the head back to the tail's end: corners 0 and 1 at the front.
    const back = step(2, vertex) * (tail + smear) - (1 - step(2, vertex)) * 6
    const side = (step(1, vertex % 2) * 2 - 1) * HALF_WIDTH
    const point = vec2(head - way * back + across * side)

    return {
      at: vec4((point.x / size.x) * 2 - 1, (point.y / size.y) * 2 - 1, 0, 1),
      a: vec4(back, side, tail, fade),
      b: vec4(smear, 0, 0, 0),
    }
  },
  spot => {
    const behind = spot.a.x
    const side = spot.a.y
    const tail = spot.a.z
    const smear = spot.b.x
    const along = clamp(1 - behind / tail, 0, 1) * step(0, behind)
    const thin = 1.1 * (1 - 0.6 * clamp(behind / tail, 0, 1))
    const streak = along * along * exp(-(side * side) / (thin * thin))
    // The head, smeared over the last frame's travel, so it moves smoothly between frames.
    const fromHead = max(behind - smear, 0) + min(behind, 0) * -1
    const spark = exp(-(fromHead * fromHead + side * side) / 6)
    // Keep the prompt box clear.
    const box =
      step(composer.x, spot.uv.x) * step(spot.uv.x, composer.z) * step(composer.y, spot.uv.y) * step(spot.uv.y, composer.w)
    const light = min(spot.a.w * (streak * 0.8 + spark), 1) * (1 - box)

    return vec4(light, light, light, light)
  },
)

export default shader({
  fps: 60,
  // A clear picture first, then the stars added over it.
  passes: [charge, picture(() => vec4(0, 0, 0, 0)), fall],
})
