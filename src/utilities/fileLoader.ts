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

  const extension = __filename.endsWith('.ts') ? 'ts' : 'js'
  const pattern = `${process.cwd().replace(/\\/g, '/')}/${dirName}/**/*.${extension}`

  const files = await glob(pattern)
  return files
}
