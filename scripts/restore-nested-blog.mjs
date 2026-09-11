/**
 * Restore nested blog folders after a Payload sync that wiped them.
 *
 * Older tenant-cli only readdir()s the blog root, then rm -rf the tree.
 * If kennisbank/ (etc.) is already present — newer sync kept it — leave it
 * so CMS edits are not overwritten by git checkout.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'

const nested = ['kennisbank', 'reviews', 'begrafenisondernemer', 'de']

function missingOrEmpty(rel) {
  if (!existsSync(rel)) return true
  try {
    return readdirSync(rel).length === 0
  } catch {
    return true
  }
}

if (!existsSync('.git')) {
  console.log('[restore-nested-blog] no .git — skip')
  process.exit(0)
}

for (const dir of nested) {
  const rel = `src/content/blog/${dir}`
  if (!missingOrEmpty(rel)) {
    console.log(`[restore-nested-blog] keep ${rel} (present after sync)`)
    continue
  }
  const result = spawnSync('git', ['checkout', 'HEAD', '--', rel], { encoding: 'utf8' })
  if (result.status === 0) {
    console.log(`[restore-nested-blog] restored ${rel}`)
  } else {
    const err = (result.stderr || result.stdout || '').trim()
    console.warn(`[restore-nested-blog] ${rel}: ${err || `exit ${result.status}`}`)
  }
}
