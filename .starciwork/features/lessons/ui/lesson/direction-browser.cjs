// An isolated headless Chrome driven over the DevTools protocol, shared by the build and the check of this drawing.
const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

async function launch(profile) {
  const executable = candidates.find(file => fs.existsSync(file))
  if (!executable) throw new Error('No Chrome found; set CHROME_PATH')
  fs.mkdirSync(profile, { recursive: true })
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const endpoint = await new Promise((resolve, reject) => {
    let log = ''
    child.stderr.on('data', data => { log += data; const match = log.match(/DevTools listening on (ws:\/\/\S+)/); if (match) resolve(match[1]) })
    child.on('exit', code => reject(new Error(`Chrome exited ${code}: ${log}`)))
  })
  const port = new URL(endpoint).port
  const tab = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page')
  const socket = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map()
  const errors = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.resolve(message.result) }
    else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails)
  })
  const command = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, { resolve, reject }); socket.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const waitFor = async (expression, tries = 200) => {
    for (let i = 0; i < tries; i++) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)) }
    throw new Error(`Timed out: ${expression}`)
  }
  await command('Runtime.enable')
  await command('Page.enable')
  const close = async () => {
    socket.close()
    child.kill()
    await new Promise(resolve => child.once('exit', resolve))
    await new Promise(resolve => setTimeout(resolve, 300))
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
  return { command, evaluate, waitFor, errors, close }
}

module.exports = { launch, profileDir: dir => path.join(dir, '.direction-build', 'profile') }
