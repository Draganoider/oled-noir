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
// Stars fall all the time Claude works, never in gusts with gaps: the rate decides how many slots are
// lit, not whether a star happens to come. Every slot repeats on the same period, each starting a
// golden-ratio step after the one before, so however many are lit their stars come evenly spaced. As
// the rate climbs, the next slot fades in; as it eases, the last one fades out. Each star is a thin
// strip drawn only where it is.
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

/** Enough for 30 stars a second, past the stormiest setting. */
const SLOTS = 96
/** Seconds between one slot's stars: a lit slot starts a star this often. */
const PERIOD = 3.2
/** Half a strip's width, in points: room for the glow round the head, and no more. */
const HALF_WIDTH = 3.5

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
  // The app budgets the draw by this, so it is kept true. At the stormiest, about 74 slots are lit and
  // at most all of them show at once, each a strip of up to about 185 by 7 points: under 0.07 of a
  // 1512 by 945 window. Strips are measured in points, so a wider window costs no more.
  { count: 4, instances: SLOTS, cover: 0.07, draw: 'strip', blend: 'add' },
  (vertex, slot) => {
    const build = charge.at(vec2(0, 0)).x
    const rate = mix(v.base * v.working, v.peak, pow(build, 1.4)) * (0.85 + 0.3 * v.pace)
    // How lit this slot is: the slots below rate × PERIOD fully, the next one in part.
    const lit = clamp(rate * PERIOD - slot, 0, 1)

    const shifted = time + fract(slot * 0.618034) * PERIOD
    const cycle = floor(shifted / PERIOD)
    const age = shifted - cycle * PERIOD
    const seed = cycle * 7.31 + slot * 1.73
    const life = 1.2 + hash(seed + 2.1) * 0.7
    const done = age / life

    if (still > 0) return { hide: true }
    if (lit <= 0) return { hide: true }
    if (done > 1) return { hide: true }

    // Down and to the left, as Starfield's own shooting stars fall, each a little steeper or flatter.
    const way = vec2(normalize(vec2(-0.846 + (hash(seed + 5.3) - 0.5) * 0.25, -0.533)))
    const across = vec2(-way.y, way.x)
    const speed = 260 + hash(seed + 3.9) * 160
    // Every star starts inside the window, so none is spent falling where no one sees it.
    const start = vec2(size.x * (0.15 + hash(seed + 0.5) * 0.85), size.y * (0.35 + hash(seed + 1.3) * 0.63))
    const head = vec2(start + way * speed * age)
    const tail = min(speed * age, 80 + hash(seed + 6.7) * 80) + 1
    const smear = speed * dt
    const fade = lit * smoothstep(0, 0.1, done) * (1 - smoothstep(0.65, 1, done))

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
    const spark = exp(-(fromHead * fromHead + side * side) / 4)
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
