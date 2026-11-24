// Builds the animated previews the README shows, straight from the scenes the mod draws:
// assets/scenes/<look>.svg for each look, and assets/banner.svg.
// Run from the repository's top folder with Node 23.6 or newer (it reads the TypeScript scenes as they are):
//   node scripts/build-previews.mjs

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  deepFieldSvg,
  eclipseSvg,
  murmurationSvg,
  nightRainSvg,
  oscilloscopeSvg,
  starfieldSvg,
  topographySvg,
} from '../hooks/scenes.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const scenesFolder = join(root, 'assets', 'scenes')

mkdirSync(scenesFolder, { recursive: true })

const looks = {
  eclipse: eclipseSvg,
  'deep-field': deepFieldSvg,
  starfield: starfieldSvg,
  oscilloscope: oscilloscopeSvg,
  'night-rain': nightRainSvg,
  topography: topographySvg,
  murmuration: murmurationSvg,
}

for (const [name, draw] of Object.entries(looks)) {
  const svg = draw()

  writeFileSync(join(scenesFolder, `${name}.svg`), svg)
  console.log(`assets/scenes/${name}.svg  ${(svg.length / 1024).toFixed(1)} KB`)
}

// The banner: the eclipse, scaled into the right of a wide black strip, with the name beside it.
const eclipse = eclipseSvg().replace(
  /^<svg[^>]*>/,
  '<svg x="300" y="-60" width="1000" height="625" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">',
)

let stars = ''
let seed = 5

const next = () => {
  seed = (seed * 16807) % 2147483647

  return seed / 2147483647
}

for (let i = 0; i < 46; i += 1) {
  const x = (next() * 420).toFixed(1)
  const y = (next() * 420).toFixed(1)
  const r = (0.5 + next() ** 3 * 1.3).toFixed(1)
  const shade = Math.round(80 + next() * 140)
    .toString(16)
    .padStart(2, '0')

  stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#${shade}${shade}${shade}"/>`
}

const banner =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 420" width="1280" height="420">' +
  '<rect width="1280" height="420" fill="#000"/>' +
  stars +
  eclipse +
  '<linearGradient id="bn-fade" x1="0" x2="1"><stop offset=".25" stop-color="#000"/>' +
  '<stop offset=".6" stop-color="#000" stop-opacity="0"/></linearGradient>' +
  '<rect width="700" height="420" fill="url(#bn-fade)"/>' +
  '<g font-family="Segoe UI, Helvetica Neue, Arial, sans-serif">' +
  '<text x="78" y="196" font-size="88" font-weight="300" letter-spacing="16" fill="#f2f2f2">OLED NOIR</text>' +
  '<text x="82" y="248" font-size="25" fill="#a8a8a8">True-black looks for the Claude desktop app</text>' +
  '<text x="83" y="300" font-size="14" letter-spacing="4" fill="#5c5c5c">EIGHT LOOKS · SLOW ANIMATED SCENES · MADE FOR OLED</text>' +
  '</g></svg>'

writeFileSync(join(root, 'assets', 'banner.svg'), banner)
console.log(`assets/banner.svg  ${(banner.length / 1024).toFixed(1)} KB`)
