/**
 * Restore nested blog folders after Payload sync.
 *
 * tenant-cli sync only readdir()s the blog root, then rm -rf the tree and
 * writes Payload posts as flat <slug>.md. That deletes kennisbank/, reviews/,
 * begrafenisondernemer/ and de/, so those articles 404 on the live site.
 * Jenkins still clones the full git tree first — check those dirs back out
 * before `astro build`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const nested = ['kennisbank', 'reviews', 'begrafenisondernemer', 'de']

if (!existsSync('.git')) {
  console.log('[restore-nested-blog] no .git — skip')
  process.exit(0)
}

for (const dir of nested) {
  const rel = `src/content/blog/${dir}`
  const result = spawnSync('git', ['checkout', 'HEAD', '--', rel], { encoding: 'utf8' })
  if (result.status === 0) {
    console.log(`[restore-nested-blog] restored ${rel}`)
  } else {
    const err = (result.stderr || result.stdout || '').trim()
    console.warn(`[restore-nested-blog] ${rel}: ${err || `exit ${result.status}`}`)
  }
}
