#!/usr/bin/env node
/**
 * fumii pre-flight check
 * Run: node scripts/check-env.js
 * Verifies Node version, required directories, and native module availability.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

let ok = true

function check(label, fn) {
  try {
    const result = fn()
    console.log(`  ✓  ${label}${result ? ` — ${result}` : ''}`)
  } catch (err) {
    console.error(`  ✗  ${label} — ${err.message}`)
    ok = false
  }
}

console.log('\nfumii pre-flight check\n')

check('Node.js version ≥ 20', () => {
  const [major] = process.versions.node.split('.')
  if (Number(major) < 20) throw new Error(`found ${process.versions.node}`)
  return process.versions.node
})

check('npm available', () => {
  return execSync('npm --version').toString().trim()
})

check('node_modules exists', () => {
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    throw new Error('run npm install first')
  }
})

check('better-sqlite3 present', () => {
  require('better-sqlite3')
  return 'ok'
})

check('keytar present', () => {
  require('keytar')
  return 'ok'
})

check('electron present', () => {
  const pkg = JSON.parse(fs.readFileSync(
    path.join(__dirname, '..', 'node_modules', 'electron', 'package.json'), 'utf8'
  ))
  return `v${pkg.version}`
})

check('src/assets/sprites dir exists', () => {
  const dir = path.join(__dirname, '..', 'src', 'assets', 'sprites')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return 'ok'
})

check('sprite sheet placeholder check', () => {
  const sheet = path.join(__dirname, '..', 'src', 'assets', 'sprites', 'fumii_sheet.png')
  if (!fs.existsSync(sheet)) return 'NOT FOUND — placeholder renderer will be used (ok for dev)'
  return 'found'
})

console.log(ok ? '\nAll checks passed — run npm run dev\n' : '\nSome checks failed — see above\n')
process.exit(ok ? 0 : 1)
