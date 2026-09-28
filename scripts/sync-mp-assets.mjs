import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

const outputRoot = join('dist', 'build', 'mp-weixin')
const manifestPath = join(outputRoot, 'common', 'assets.js')
const outputAssets = join(outputRoot, 'assets')
const sourceAssets = join('static', 'ui')

if (!existsSync(manifestPath)) {
  throw new Error(`Missing mini-program asset manifest: ${manifestPath}`)
}

const manifest = readFileSync(manifestPath, 'utf8')
const emittedFiles = [...manifest.matchAll(/"\/assets\/([^"?]+)"/g)].map(match => match[1])

if (!emittedFiles.length) {
  throw new Error('No mini-program image assets were found in the generated manifest')
}

mkdirSync(outputAssets, { recursive: true })

for (const emittedFile of emittedFiles) {
  const extension = extname(emittedFile)
  const sourceName = basename(emittedFile, extension).replace(/\.[0-9a-f]{8}$/i, '') + extension
  const sourcePath = join(sourceAssets, sourceName)

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing source image for ${emittedFile}: ${sourcePath}`)
  }

  copyFileSync(sourcePath, join(outputAssets, emittedFile))
}

console.log(`Synced ${emittedFiles.length} mini-program image assets.`)
