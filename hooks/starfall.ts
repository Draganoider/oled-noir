// Starfall's falling stars, drawn over the Starfield sky while Claude works.
// The mod sets two numbers: `working`, 1 while a turn runs, and `pace`, how fast Claude is writing,
// from 0 to 1. With neither, nothing falls. Working alone, a star falls every eight seconds or so;
// at full pace, a little more than one a second. The app eases between them, so the sky never jumps.
//
// Six slots, each with its own period. In every period a slot lights one star or none, by a fixed hash
// against the chance the two numbers give, so each star is decided when its period starts.

import {
  clamp,
  composer,
  dot,
  exp,
  floor,
  fract,
  min,
  picture,
  pow,
  range,
  shader,
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

const v = values({ working: [0, 1], pace: [0, 1] })

function hash(seed: number): number {
  return fract(sin(seed * 12.9898 + 78.233) * 43758.5453)
}

export default shader({
  fps: 60,
  passes: [
    picture(p => {
      // Points, with y running up, as the app's own coordinates do.
      const heat = v.working * (0.18 + 0.82 * v.pace)
      const chance = 0.85 * pow(heat, 1.3)

      // Idle, or under Reduce Motion: nothing falls, and the pixel costs next to nothing.
      if (chance < 0.001 || still > 0) return vec4(0, 0, 0, 0)

      const at = vec2(p.uv * size)
      let light = 0

      for (const slot of range(6)) {
        const period = 3.2 + slot * 0.37
        const shifted = time + slot * 2.9
        const cycle = floor(shifted / period)
        const age = shifted - cycle * period
        const seed = cycle * 7.31 + slot * 1.73
        const life = 0.9 + fract(seed * 0.618) * 0.4
        const done = age / life

        // A slot with no star this period, or whose star has burnt out, costs nothing more.
        if (hash(seed) >= chance || done > 1) continue

        // Down and to the left, as Starfield's own shooting stars fall.
        const way = vec2(-0.846, -0.533)
        const start = vec2(size.x * (0.2 + hash(seed + 0.5) * 0.95), size.y * (0.58 + hash(seed + 1.3) * 0.4))
        const travel = 380 + hash(seed + 3.9) * 220
        const head = vec2(start + way * travel * min(done, 1))

        const toward = vec2(at - head)
        const behind = dot(toward, way) * -1
        const side = vec2(toward + way * behind)
        const sideways = dot(side, side)
        const tail = 40 + 140 * clamp(done * 4, 0, 1)
        const along = clamp(1 - behind / tail, 0, 1) * step(0, behind)
        const thin = 1.1 * (1 - 0.6 * clamp(behind / tail, 0, 1))
        const streak = along * along * exp(-sideways / (thin * thin))
        const spark = exp(-dot(toward, toward) / 7)
        const fade = smoothstep(0, 0.12, done) * (1 - smoothstep(0.6, 1, done))

        light += fade * (streak * 0.8 + spark)
      }

      // Keep the prompt box clear.
      const box =
        step(composer.x, p.uv.x) * step(p.uv.x, composer.z) * step(composer.y, p.uv.y) * step(p.uv.y, composer.w)
      const shown = clamp(light, 0, 1) * (1 - box)

      return vec4(shown, shown, shown, shown)
    }),
  ],
})
