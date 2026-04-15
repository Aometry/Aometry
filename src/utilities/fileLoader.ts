import { glob } from 'glob'
import path from 'path'

export async function loadFiles (dirName: string): Promise<string[]> {
  // We need to look in the src directory for TS files during dev,
  // or dist for JS files during prod, OR handle the absolute path logic carefully.
  // The original code passed 'modules' or 'events' which are relative to cwd.
  // In TS structure, we might want to look in src/modules or src/events.

  // However, for dynamic loading of commands/events, we need to be careful about
  // whether we are loading .ts source files or .js compiled files.
  // During dev (ts-node), we load .ts. During prod, we load .js.

  const isTs = __filename.endsWith('.ts')

  // If we are in production (.js), we should look in the dist folder for core files
  // assuming dirName starts with 'src' or 'installed_modules'.
  let baseDir = dirName
  // Only prepend dist/ if we are in production AND looking at core files (src/)
  if (!isTs && dirName.startsWith('src')) {
    baseDir = `dist/${dirName}`
  }

  // Look for both extensions if in production to support runtime-installed modules
  const extension = isTs ? 'ts' : '{js,ts}'
  // Use a negative lookbehind if possible or just filter later. 
  // Glob doesn't support easy 'exclude' within the pattern for d.ts easily.
  // Actually, Glob 10 supports ignore.
  const pattern = `${process.cwd().replace(/\\/g, '/')}/${baseDir}/**/*.${extension}`

  const files = await glob(pattern, { ignore: '**/*.d.ts' })
  return files
}
