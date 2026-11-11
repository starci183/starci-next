// Captures every screen of the app at 1440, 1920 and 390 into gallery/pages/<area>/<screen>/<width>.png.
// Dynamic routes take the first link the list screen shows. usage: node gallery/scripts/capture.cjs <state.json> [area-filter]
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'D:/starci-tmp/pw-tool/node_modules/playwright')
const fs = require('fs'), path = require('path')
const ENTRY = 'http://localhost:3080'
const [, , stateFile, only, onlyScreen] = process.argv
const PAGES = path.join(__dirname, '..', 'pages')
const WIDTHS = process.env.CAPTURE_WIDTHS ? process.env.CAPTURE_WIDTHS.split(",").map(Number) : [1440, 1920, 390]
const S = (area, screen, route, extra = {}) => ({ area, screen, route, ...extra })
const SCREENS = [
  S('auth', 'sign-in', '/sign-in', { guest: true }),
  S('auth', 'sign-up', '/sign-in', { guest: true, click: 'Đăng ký' }),
  S('learn', 'home', '/'),
  S('paths', 'choose', '/paths/choose'),
  S('essentials', 'catalog', '/essentials'),
  S('essentials', 'topic', '/essentials/backend-framework'),
  S('essentials', 'lesson', '/essentials/backend-framework/request-response-lifecycle'),
  S('essentials', 'lesson-challenge', '/essentials/backend-framework/request-response-lifecycle?phase=challenge'),
  S('essentials', 'lesson-predict', '/essentials/backend-framework/request-response-lifecycle?phase=predict'),
  S('essentials', 'lesson-explore', '/essentials/backend-framework/request-response-lifecycle?phase=explore'),
  S('essentials', 'lesson-explain', '/essentials/backend-framework/request-response-lifecycle?phase=explain'),
  S('essentials', 'lesson-apply', '/essentials/backend-framework/request-response-lifecycle?phase=apply'),
  S('essentials', 'lesson-reflect', '/essentials/backend-framework/request-response-lifecycle?phase=reflect'),
  S('essentials', 'topic-databases', '/essentials/databases'),
  S('essentials', 'topic-api-reliability', '/essentials/api-reliability'),
  S('essentials', 'topic-kubernetes', '/essentials/kubernetes'),
  S('essentials', 'lesson-transactions', '/essentials/databases/transactions-and-isolation'),
  S('essentials', 'lesson-indexing', '/essentials/databases/indexing-and-query-plans'),
  S('essentials', 'lesson-indexing-apply', '/essentials/databases/indexing-and-query-plans?phase=apply'),
  S('essentials', 'lesson-idempotency', '/essentials/api-reliability/idempotency'),
  S('essentials', 'lesson-idempotency-apply', '/essentials/api-reliability/idempotency?phase=apply'),
  S('essentials', 'lesson-idempotency-challenge', '/essentials/api-reliability/idempotency?phase=challenge'),
  S('essentials', 'lesson-idempotency-predict', '/essentials/api-reliability/idempotency?phase=predict'),
  S('essentials', 'lesson-idempotency-explore', '/essentials/api-reliability/idempotency?phase=explore'),
  S('essentials', 'lesson-idempotency-explain', '/essentials/api-reliability/idempotency?phase=explain'),
  S('essentials', 'lesson-idempotency-reflect', '/essentials/api-reliability/idempotency?phase=reflect'),
  S('essentials', 'lesson-idempotency-apply-java', '/essentials/api-reliability/idempotency?phase=apply', { click: 'Java' }),
  S('review', 'hub', '/review'),
  S('review', 'decks', '/review/decks'),
  S('review', 'session', '/review/session'),
  S('practice', 'list', '/practice'),
  S('practice', 'problem', { from: '/practice', match: /^\/practice\/(?!patterns)[^/]+$/ }),
  S('practice', 'pattern', { from: '/practice', match: /^\/practice\/patterns\/[^/]+$/ }),
  S('incidents', 'list', '/incidents'),
  S('interview', 'start', '/interview'),
  S('interview', 'session', { from: '/interview', match: /^\/interview\/[^/]+$/ }),
  S('interview', 'report', { from: '/interview', match: /^\/interview\/[^/]+\/report$/ }),
  S('projects', 'list', '/projects'),
  S('projects', 'new', '/projects/new'),
  S('projects', 'detail', { from: '/projects', match: /^\/projects\/(?!new)[^/]+$/ }),
  S('projects', 'detail-demo', '/projects/912e8d04-8e15-48bf-9af1-56553e4822ea'),
  S('projects', 'milestone-data-and-cache', '/projects/912e8d04-8e15-48bf-9af1-56553e4822ea/bf-data-and-cache'),
  S('projects', 'milestone-safe-and-reliable', '/projects/912e8d04-8e15-48bf-9af1-56553e4822ea/bf-safe-and-reliable'),
  S('projects', 'milestone', { from: 'projects/detail', append: '/bf-http-foundation' }),
  S('agents', 'catalog', '/agents'),
  S('agents', 'track', { from: '/agents', match: /^\/agents\/tracks\/[^/]+$/ }),
  S('career', 'experience', '/experience'),
  S('career', 'profile', '/profile'),
  S('career', 'review-queue', '/review-queue'),
  S('career', 'review-item', { from: '/review-queue', match: /^\/review-queue\/[^/]+$/ }),
  S('commerce', 'premium', '/premium'),
  S('commerce', 'premium-result', '/premium/result'),
  S('devices', 'list', '/devices'),
]
const norm = (href) => { try { const u = new URL(href, ENTRY); return u.pathname.replace(/^\/(vi|en)(?=\/|$)/, '') || '/' } catch { return null } }
;(async () => {
  const b = await chromium.launch()
  const user = await b.newContext({ storageState: stateFile })
  const guest = await b.newContext()
  // next dev's HMR socket answers every new page with a rebuild + restart (a full reload, again and again), so a shot taken during it shows the loading state.
  // Pass the socket through but drop its rebuild messages: the page loads once and stays.
  const hmrQuiet = (ws) => {
    const up = ws.connectToServer()
    up.onMessage((m) => { if (/"type":"(building|built|restart)"|turbopack-message/.test(String(m))) return; ws.send(m) })
    ws.onMessage((m) => up.send(m))
  }
  await user.routeWebSocket(/_next\/hmr/, hmrQuiet); await guest.routeWebSocket(/_next\/hmr/, hmrQuiet)
  const resolved = {}, report = []
  for (const s of SCREENS) {
    if (only && s.area !== only) continue
    if (onlyScreen && !s.screen.startsWith(onlyScreen)) continue
    let route = s.route
    if (typeof route === 'object') {
      const fromPath = route.from.startsWith('/') ? route.from : resolved[route.from]
      if (!fromPath) { report.push(`${s.area}/${s.screen}: no parent`); continue }
      if (route.append) { route = fromPath + route.append } else {
      const p = await user.newPage(); await p.setViewportSize({ width: 1440, height: 900 })
      await p.goto(ENTRY + fromPath, { waitUntil: 'load' }).catch(() => {})
      let hrefs = []
      for (let attempt = 0; attempt < 4; attempt++) {
        // A page that reloads or redirects after load (next dev compile, locale redirect) destroys the context: settle and read again.
        try { await p.waitForTimeout(2500); hrefs = await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href'))); break } catch { await p.waitForTimeout(1500) }
      }
      await p.close()
      route = hrefs.map(norm).find((h) => h && route.match.test(h))
      }
      if (!route) { report.push(`${s.area}/${s.screen}: no link on ${fromPath}`); continue }
    }
    resolved[`${s.area}/${s.screen}`] = route
    const dir = path.join(PAGES, s.area, s.screen); fs.mkdirSync(dir, { recursive: true })
    for (const w of WIDTHS) {
      const p = await (s.guest ? guest : user).newPage()
      await p.setViewportSize({ width: w, height: Number(process.env.CAPTURE_HEIGHT) || (w === 390 ? 844 : w === 1920 ? 1080 : w === 2560 ? 1440 : 900) })
      const res = await p.goto(ENTRY + route, { waitUntil: 'load' }).catch((e) => ({ status: () => String(e.message).slice(0, 60) }))
      if (s.click) { await p.getByText(s.click, { exact: true }).first().click().catch(() => {}); await p.waitForTimeout(800) }
      await p.waitForTimeout(1200)
      if (w === 390) {
        // The shell is one viewport tall and its main area scrolls once (stacked panes grow, Grammar 0.37.14): grow the viewport by what any scroller still holds beyond its box (up to 4 passes, the layout settles between them) so the shot shows the whole page.
        let height = 844
        for (let pass = 0; pass < 4; pass++) {
          // next dev may reload the page (a late compile): wait for it to settle and measure again instead of failing the run.
          const extra = await p.evaluate(() => Math.max(0, ...[...document.querySelectorAll('*')].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY)).map((e) => e.scrollHeight - e.clientHeight)))
            .catch(async () => { await p.waitForTimeout(2500); return 2 })
          if (extra <= 1) break
          height += extra
          await p.setViewportSize({ width: w, height })
          await p.waitForTimeout(700)
        }
      }
      await p.screenshot({ path: path.join(dir, `${w}.png`), fullPage: true })
      if (w === 1440) report.push(`${s.area}/${s.screen}: ${route} -> ${res?.status?.()} final ${norm(p.url())}`)
      await p.close()
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'capture-report.txt'), report.join('\n') + '\n')
  console.log(report.join('\n'))
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
