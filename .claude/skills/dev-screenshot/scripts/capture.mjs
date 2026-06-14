#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

const DEFAULT_BASE_URL = process.env.DEV_SERVER_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
const DEFAULT_EMAIL = process.env.DEV_SCREENSHOT_EMAIL || process.env.SCREENSHOT_EMAIL || 'dev@bullcapital.app'
const DEFAULT_PASSWORD = process.env.DEV_SCREENSHOT_PASSWORD || process.env.SCREENSHOT_PASSWORD || 'senha123456'
const DEFAULT_OUT_DIR = '.screenshots'

const VIEWPORTS = {
  desktop: {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
  },
  mobile: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
}

function usage() {
  return `Usage:
  node .claude/skills/dev-screenshot/scripts/capture.mjs [path-or-url] [options]

Examples:
  node .claude/skills/dev-screenshot/scripts/capture.mjs /home --both
  node .claude/skills/dev-screenshot/scripts/capture.mjs /clients --mobile --name clients-mobile
  DEV_SERVER_URL=http://localhost:3001 node .claude/skills/dev-screenshot/scripts/capture.mjs /terminal

Options:
  --base <url>       Dev server base URL. Default: ${DEFAULT_BASE_URL}
  --out <dir>        Output directory. Default: ${DEFAULT_OUT_DIR}
  --name <slug>      Output filename stem. Default: route-derived slug
  --desktop          Capture desktop viewport
  --mobile           Capture mobile viewport
  --both             Capture desktop and mobile viewports
  --viewport WxH     Custom single viewport, e.g. 1280x900
  --selector <css>   Wait for a selector before capture
  --wait <ms>        Extra wait after load/fonts. Default: 1200
  --email <email>    Login email. Default: ${DEFAULT_EMAIL}
  --password <pass>  Login password. Default: dev seed password
  --no-auth          Skip login and capture as anonymous
  --no-full-page     Capture only the viewport
  --headed           Run Chromium with a visible window
  --debug            Print extra browser state
  --help             Show this help
`
}

function parseArgs(argv) {
  const options = {
    target: '/home',
    baseUrl: DEFAULT_BASE_URL,
    outDir: DEFAULT_OUT_DIR,
    name: null,
    modes: new Set(),
    customViewport: null,
    selector: null,
    waitMs: 1200,
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
    auth: true,
    fullPage: true,
    headed: false,
    debug: false,
  }

  const readValue = (args, index, flag) => {
    const value = args[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`)
    return value
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      console.log(usage())
      process.exit(0)
    }
    if (arg === '--base') {
      options.baseUrl = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--out') {
      options.outDir = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--name') {
      options.name = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--selector') {
      options.selector = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--wait') {
      options.waitMs = Number(readValue(argv, i, arg))
      if (!Number.isFinite(options.waitMs) || options.waitMs < 0) throw new Error('--wait must be a positive number')
      i += 1
      continue
    }
    if (arg === '--email') {
      options.email = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--password') {
      options.password = readValue(argv, i, arg)
      i += 1
      continue
    }
    if (arg === '--viewport') {
      const raw = readValue(argv, i, arg)
      const match = raw.match(/^(\d{3,5})x(\d{3,5})$/i)
      if (!match) throw new Error('--viewport must look like 1280x900')
      options.customViewport = {
        width: Number(match[1]),
        height: Number(match[2]),
        deviceScaleFactor: 1,
        mobile: false,
        userAgent: VIEWPORTS.desktop.userAgent,
      }
      i += 1
      continue
    }
    if (arg === '--desktop') {
      options.modes.add('desktop')
      continue
    }
    if (arg === '--mobile') {
      options.modes.add('mobile')
      continue
    }
    if (arg === '--both') {
      options.modes.add('desktop')
      options.modes.add('mobile')
      continue
    }
    if (arg === '--no-auth') {
      options.auth = false
      continue
    }
    if (arg === '--no-full-page') {
      options.fullPage = false
      continue
    }
    if (arg === '--headed') {
      options.headed = true
      continue
    }
    if (arg === '--debug') {
      options.debug = true
      continue
    }
    if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`)
    options.target = arg
  }

  if (options.customViewport) {
    options.modes = new Set(['custom'])
  } else if (options.modes.size === 0) {
    options.modes.add('desktop')
  }

  return options
}

async function getFreePort() {
  const server = createServer()
  await new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  return address.port
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForHttpJson(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return response.json()
      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error
    }
    await wait(150)
  }
  throw lastError || new Error(`Timed out waiting for ${url}`)
}

async function checkServer(baseUrl) {
  try {
    await fetch(baseUrl, { redirect: 'manual' })
  } catch (error) {
    throw new Error(
      `Dev server not reachable at ${baseUrl}. Start it with "cd web && pnpm dev" or pass --base <url>.\n${error.message}`
    )
  }
}

function findChromium() {
  const candidates = [
    process.env.CHROMIUM_PATH,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate))
}

async function readEnvValue(files, key) {
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8')
      const line = content
        .split(/\r?\n/)
        .find((candidate) => candidate.trim().startsWith(`${key}=`))
      if (!line) continue
      return line.slice(line.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')
    } catch {
      // Ignore missing env files; this is a best-effort diagnostic.
    }
  }
  return null
}

async function warnIfNextAuthUrlDiffers(base) {
  const nextAuthUrl = await readEnvValue(['web/.env.local', '.env.local'], 'NEXTAUTH_URL')
  if (!nextAuthUrl) return

  try {
    const configured = new URL(nextAuthUrl)
    if (configured.origin !== base.origin) {
      console.warn(
        `[warn] NEXTAUTH_URL is ${configured.origin}, but screenshots use ${base.origin}. Auth may redirect or fail; use --base ${configured.origin} when that host is reachable, or run the dev server with NEXTAUTH_URL=${base.origin}.`
      )
    }
  } catch {
    // Ignore invalid env values; Auth.js will report the real error if it matters.
  }
}

async function launchChromium({ headed }) {
  const executable = findChromium()
  if (!executable) throw new Error('Chromium not found. Set CHROMIUM_PATH or install chromium.')

  const port = await getFreePort()
  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'bull-dev-screenshot-'))
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1440,1000',
    'about:blank',
  ]

  if (!headed) args.unshift('--headless=new')
  if (process.getuid?.() === 0) args.unshift('--no-sandbox')

  const child = spawn(executable, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
  })

  try {
    const tabs = await waitForHttpJson(`http://127.0.0.1:${port}/json/list`, 10000)
    const page = tabs.find((tab) => tab.type === 'page' && tab.webSocketDebuggerUrl)
    if (!page) throw new Error('No page target exposed by Chromium')
    return { child, profileDir, webSocketUrl: page.webSocketDebuggerUrl, stderr }
  } catch (error) {
    child.kill('SIGKILL')
    await rm(profileDir, { recursive: true, force: true })
    throw new Error(`Could not start Chromium: ${error.message}\n${stderr}`.trim())
  }
}

async function stopChromium(browser) {
  const child = browser.child

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGTERM')
    const exited = await Promise.race([
      new Promise((resolve) => child.once('exit', () => resolve(true))),
      wait(1000).then(() => false),
    ])

    if (!exited && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
      await Promise.race([
        new Promise((resolve) => child.once('exit', () => resolve(true))),
        wait(1000).then(() => false),
      ])
    }
  }

  try {
    await rm(browser.profileDir, { recursive: true, force: true })
  } catch {
    await wait(250)
    await rm(browser.profileDir, { recursive: true, force: true }).catch(() => {
      console.warn(`[warn] Could not remove temporary Chromium profile: ${browser.profileDir}`)
    })
  }
}

class CDPClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl
    this.nextId = 1
    this.pending = new Map()
    this.eventWaiters = new Map()
  }

  async connect() {
    this.ws = new WebSocket(this.webSocketUrl)
    await new Promise((resolve, reject) => {
      this.ws.addEventListener('open', resolve, { once: true })
      this.ws.addEventListener('error', reject, { once: true })
    })
    this.ws.addEventListener('message', (event) => this.handleMessage(event))
  }

  handleMessage(event) {
    const message = JSON.parse(event.data)
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id)
      this.pending.delete(message.id)
      if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ''}`.trim()))
      else resolve(message.result || {})
      return
    }

    if (message.method && this.eventWaiters.has(message.method)) {
      const waiters = this.eventWaiters.get(message.method)
      this.eventWaiters.delete(message.method)
      for (const resolve of waiters) resolve(message.params || {})
    }
  }

  send(method, params = {}) {
    const id = this.nextId
    this.nextId += 1
    const payload = JSON.stringify({ id, method, params })
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(payload)
    })
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs)
      const wrappedResolve = (params) => {
        clearTimeout(timer)
        resolve(params)
      }
      const waiters = this.eventWaiters.get(method) || []
      waiters.push(wrappedResolve)
      this.eventWaiters.set(method, waiters)
    })
  }

  async evaluate(expression, awaitPromise = false) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise,
      returnByValue: true,
    })
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Evaluation failed')
    }
    return result.result?.value
  }

  close() {
    this.ws?.close()
  }
}

function escapeForJs(value) {
  return JSON.stringify(value)
}

async function navigate(cdp, url) {
  const load = cdp.waitForEvent('Page.loadEventFired', 20000).catch(() => null)
  await cdp.send('Page.navigate', { url })
  await load
  await cdp.evaluate('document.readyState === "complete" || document.readyState === "interactive"')
}

async function waitForCondition(cdp, expression, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await cdp.evaluate(`Boolean(${expression})`).catch(() => false)
    if (ok) return
    await wait(150)
  }
  throw new Error(`Timed out waiting for ${label}`)
}

function resolveUrls(baseUrl, target) {
  const base = new URL(baseUrl)
  const url = target.startsWith('http://') || target.startsWith('https://') ? new URL(target) : new URL(target, base)
  const callbackPath = url.origin === base.origin ? `${url.pathname}${url.search}` : '/home'
  return { base, targetUrl: url, callbackPath }
}

async function login(cdp, { base, callbackPath, email, password, debug }) {
  const signIn = new URL('/auth/sign-in', base)
  signIn.searchParams.set('callbackUrl', callbackPath)

  await navigate(cdp, signIn.toString())
  await waitForCondition(
    cdp,
    'document.querySelector("input[name=email]") && document.querySelector("input[name=password]")',
    10000,
    'sign-in form'
  )

  await cdp.evaluate(
    `(() => {
      const setValue = (element, value) => {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')
        descriptor.set.call(element, value)
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
      }
      setValue(document.querySelector('input[name=email]'), ${escapeForJs(email)})
      setValue(document.querySelector('input[name=password]'), ${escapeForJs(password)})
      document.querySelector('form').requestSubmit()
      return true
    })()`
  )

  await waitForCondition(
    cdp,
    '!location.pathname.startsWith("/auth/sign-in") || document.body.innerText.includes("incorretos") || document.body.innerText.includes("Algo deu errado")',
    20000,
    'authenticated redirect'
  )

  const currentUrl = await cdp.evaluate('location.href')
  if (debug) console.log(`Auth ended at ${currentUrl}`)
  if (new URL(currentUrl).pathname.startsWith('/auth/sign-in')) {
    const bodyText = await cdp.evaluate('document.body.innerText')
    throw new Error(
      `Login failed for ${email}. Confirm Postgres is running, run "cd web && pnpm db:seed" to create the dev user, and make sure NEXTAUTH_URL matches --base. You can also pass --email/--password.\n${bodyText}`
    )
  }
}

async function setViewport(cdp, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile,
  })
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: viewport.userAgent })
}

async function settlePage(cdp, { selector, waitMs }) {
  await waitForCondition(cdp, 'document.readyState === "complete" || document.readyState === "interactive"', 10000, 'document ready')
  await cdp.evaluate('document.fonts ? document.fonts.ready.then(() => true) : true', true).catch(() => null)
  if (selector) {
    await waitForCondition(cdp, `document.querySelector(${escapeForJs(selector)})`, 10000, `selector ${selector}`)
  }
  if (waitMs > 0) await wait(waitMs)
}

async function capture(cdp, fullPage) {
  if (!fullPage) {
    return cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    })
  }

  const metrics = await cdp.send('Page.getLayoutMetrics')
  const width = Math.max(1, Math.ceil(metrics.contentSize.width))
  const height = Math.max(1, Math.ceil(metrics.contentSize.height))
  return cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  })
}

function slugifyUrl(url) {
  const slug = `${url.pathname}${url.search}`
    .replace(/^\//, '')
    .replace(/[/?#=&.]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return slug || 'root'
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const { base, targetUrl, callbackPath } = resolveUrls(options.baseUrl, options.target)

  await checkServer(base.toString())
  if (options.auth) await warnIfNextAuthUrlDiffers(base)

  const browser = await launchChromium({ headed: options.headed })
  const cdp = new CDPClient(browser.webSocketUrl)
  const written = []

  try {
    await cdp.connect()
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    const firstMode = [...options.modes][0]
    const firstViewport = firstMode === 'custom' ? options.customViewport : VIEWPORTS[firstMode]
    await setViewport(cdp, firstViewport)

    if (options.auth) {
      await login(cdp, {
        base,
        callbackPath,
        email: options.email,
        password: options.password,
        debug: options.debug,
      })
    }

    await mkdir(options.outDir, { recursive: true })

    for (const mode of options.modes) {
      const viewport = mode === 'custom' ? options.customViewport : VIEWPORTS[mode]
      await setViewport(cdp, viewport)
      await navigate(cdp, targetUrl.toString())
      await settlePage(cdp, options)

      const screenshot = await capture(cdp, options.fullPage)
      const stem = options.name || slugifyUrl(targetUrl)
      const suffix = mode === 'custom' ? `${viewport.width}x${viewport.height}` : mode
      const outputPath = path.join(options.outDir, `${stem}-${suffix}.png`)
      await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'))
      written.push(outputPath)
      console.log(`Saved ${outputPath}`)
    }
  } finally {
    cdp.close()
    await stopChromium(browser)
  }

  console.log(`Captured ${written.length} screenshot(s).`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
