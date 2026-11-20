// Captures every screen of the app at 1440 and 390 into gallery/pages/<area>/<screen>/<width>.png.
// Dynamic routes take the first link the list screen shows. usage: node scripts/gallery-capture.cjs <state.json> [area-filter]
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "D:/starci-tmp/pw-tool/node_modules/playwright")
const fs = require("fs"),
    path = require("path")
// The dev entry origin and the landing of the stack (environments.dev.local.ports: ingress 3280, landing 3202); override with CAPTURE_ENTRY / CAPTURE_LANDING.
const ENTRY = process.env.CAPTURE_ENTRY || "http://localhost:3280"
const LANDING = process.env.CAPTURE_LANDING || "http://localhost:3202"
const [, , stateFile, only, onlyScreen] = process.argv
const PAGES = path.join(__dirname, "..", "gallery", "pages")
const WIDTHS = process.env.CAPTURE_WIDTHS ? process.env.CAPTURE_WIDTHS.split(",").map(Number) : [1440, 390]
const S = (area, screen, route, extra = {}) => ({ area, screen, route, ...extra })
// The lesson the Essentials lesson screens open, and the learner's pick of the n-th opener answer (the wrong one or the right one, by the option's place in the stand-in sample).
const LESSON = "/essentials/api-reliability/outbox-idempotency"
const answerAs = async (p, n, isRight) => {
    await p
        .getByRole("button", { name: new RegExp("^Câu " + n + "$") })
        .first()
        .click()
        .catch(() => {})
    await p.waitForTimeout(600)
    const options = p.getByRole("radio")
    if ((await options.count()) === 0) return
    await options
        .nth(isRight ? 1 : 0)
        .check({ force: true })
        .catch(() => options.nth(isRight ? 1 : 0).click({ force: true }))
    await p.waitForTimeout(1200)
}
// The review reads of the hub and the session; the deck commands the review entries press.
const REVIEW_READS = /"operationName":"(ReviewToday|ReviewStats|Streak)"/
const addDeck = async (p) =>
    p
        .getByRole("button", { name: /Thêm bộ thẻ/ })
        .first()
        .click()
        .catch(() => {})
const flipCard = async (p) => {
    await p.waitForTimeout(2000)
    await p
        .getByRole("button", { name: /Hiện đáp án|Lật thẻ/ })
        .first()
        .click()
        .catch(() => {})
    await p.waitForTimeout(1500)
}
const gradeAll = async (p) => {
    for (let n = 0; n < 40; n++) {
        await p.waitForTimeout(1200)
        if ((await p.getByRole("button", { name: /Về Ôn tập/ }).count()) > 0) return
        await p
            .getByRole("button", { name: /Hiện đáp án|Lật thẻ/ })
            .first()
            .click()
            .catch(() => {})
        await p.waitForTimeout(1200)
        await p
            .getByRole("button", { name: /^Tốt/ })
            .first()
            .click()
            .catch(() => {})
    }
}
const SCREENS = [
    S("auth", "sign-in", "/sign-in", { guest: true }),
    S("auth", "sign-up", "/sign-in", { guest: true, click: "Đăng ký" }),
    S("auth", "sign-in-callback", "/sign-in/callback", { guest: true }),
    S("auth", "verify", "/verify/ABCD-2345-WXYZ", { guest: true }),
    S("landing", "home", "/", { guest: true, origin: LANDING }),
    S("learn", "home", "/"),
    S("learn", "home-account-menu", "/", { clickSel: 'button[aria-label*="@"]' }),
    S("paths", "choose", "/paths/choose"),
    S("essentials", "catalog", "/essentials"),
    // States of the catalog and the topic: first visit (a learner who studied nothing, CAPTURE_FIRST_STATE), a search with no match, the first read still loading (GraphQL held), the read failing (GraphQL refused), a reader without Premium.
    S("essentials", "catalog-first-visit", "/essentials", { first: true }),
    S("essentials", "catalog-no-match", "/essentials", {
        fill: { sel: 'input[type="search"], input[placeholder*="Tìm"]', text: "kafka exactly" },
    }),
    S("essentials", "catalog-loading", "/essentials", { hold: true }),
    S("essentials", "catalog-error", "/essentials", { refuse: true }),
    S("essentials", "catalog-free", "/essentials", { free: true }),
    S("essentials", "topic", { from: "/essentials", match: /^\/essentials\/[^/]+$/ }),
    S("essentials", "topic-first-visit", { from: "essentials/topic", append: "?s=1" }, { first: true }),
    S("essentials", "topic-free", { from: "essentials/topic", append: "?s=1" }, { free: true }),
    S("essentials", "topic-loading", { from: "essentials/topic", append: "?s=1" }, { hold: true }),
    // States of the lesson page (Bản chất and the locked parts). A scenario names its stand-in answers by cookie (plan, seed: the opener answers already given as R right and W wrong, sid) and, where the learner acts, how.
    S("essentials", "lesson", LESSON, { cookies: { seed: "R" }, act: async (p) => answerAs(p, 2, false) }),
    S("essentials", "lesson-question-1", LESSON, { cookies: { seed: "" } }),
    S("essentials", "lesson-result", LESSON, {
        cookies: { seed: "RWRR" },
        act: async (p) => {
            await answerAs(p, 5, true)
            await p
                .getByRole("button", { name: "Xem kết quả" })
                .first()
                .click()
                .catch(() => {})
        },
    }),
    S("essentials", "lesson-article", LESSON, { cookies: { seed: "RWRRW" } }),
    S("essentials", "lesson-free-end", LESSON, {
        free: true,
        cookies: { plan: "free", seed: "RWRRW" },
        act: async (p) => {
            await p
                .getByRole("button", { name: "Làm lại 5 câu" })
                .first()
                .click()
                .catch(() => {})
            for (let n = 1; n <= 5; n++) await answerAs(p, n, true)
            await p
                .getByRole("button", { name: "Xem kết quả" })
                .first()
                .click()
                .catch(() => {})
        },
    }),
    S("essentials", "lesson-locked-source", LESSON + "?part=source", {
        free: true,
        cookies: { plan: "free", seed: "RWRRW" },
    }),
    S("essentials", "lesson-locked-scenarios", LESSON + "?part=scenarios", {
        free: true,
        cookies: { plan: "free", seed: "RWRRW" },
    }),
    S("essentials", "lesson-locked-apply", LESSON + "?part=apply", {
        free: true,
        cookies: { plan: "free", seed: "RWRRW" },
    }),
    // Parts that run on the machine of the learner (Source, Scenarios, Apply). A scenario names its stand-in answers by cookie: dev (a machine online), scn (the runs), rung (the score of the ladder), up (the up command failed).
    S("essentials", "lesson-source", LESSON + "?part=source", { cookies: { dev: "on" } }),
    S("essentials", "lesson-source-no-device", LESSON + "?part=source", { cookies: { dev: "off" } }),
    S("essentials", "lesson-source-up-failed", LESSON + "?part=source", { cookies: { up: "fail" } }),
    S("essentials", "lesson-scenarios", LESSON + "?part=scenarios", { cookies: { scn: "red" } }),
    S("essentials", "lesson-scenarios-not-run", LESSON + "?part=scenarios", { cookies: { scn: "none" } }),
    S("essentials", "lesson-scenarios-running", LESSON + "?part=scenarios", { cookies: { scn: "running" } }),
    S("essentials", "lesson-scenarios-green", LESSON + "?part=scenarios&scenario=crash-after-commit", {
        cookies: { scn: "green" },
    }),
    S("essentials", "lesson-scenarios-stuck", LESSON + "?part=scenarios", { cookies: { scn: "stuck" } }),
    S("essentials", "lesson-scenarios-offline", LESSON + "?part=scenarios", { cookies: { scn: "none", dev: "off" } }),
    S("essentials", "lesson-ladder", LESSON + "?part=apply", { cookies: { rung: "mid" } }),
    S("essentials", "lesson-ladder-locked", LESSON + "?part=apply", { cookies: { rung: "mid" }, click: "Khó" }),
    S("practice", "list", "/practice"),
    S("practice", "problem", { from: "/practice/patterns/arrays", match: /^\/practice\/(?!patterns)[^/]+$/ }),
    S("practice", "pattern", "/practice/patterns/arrays"),
    S("projects", "list", "/projects"),
    S("projects", "new", "/projects/new"),
    S("projects", "detail", { from: "/projects", match: /^\/projects\/[0-9a-f-]{36}$/ }),
    S("projects", "milestone", { from: "projects/detail", match: /^\/projects\/[0-9a-f-]{36}\/[^/]+$/ }),
    S("projects", "concept", { from: "projects/milestone", match: /^\/projects\/[0-9a-f-]{36}\/[^/]+\/[^/]+$/ }),
    // A signed-in reader without Premium (CAPTURE_FREE_STATE) sees the pitch; without the file the shot falls back to the guest context.
    S("projects", "paywall", "/projects", { free: true }),
    S("career", "experience", "/experience"),
    S("career", "profile", "/profile"),
    S("commerce", "premium", "/premium"),
    S("commerce", "premium-result", "/premium/result"),
    S("devices", "list", "/devices"),
    S("connect", "ai", "/connect"),
    // --- next-ux-review: review, progress, incidents and the review queue. The entries run in order against ONE learner: the first states are shot before any deck is added, then a deck is added and reviewed.
    S("progress", "overview-first-visit", "/progress"),
    S("progress", "overview-loading", "/progress", { holdOps: /"operationName":"LearnerProgress"/ }),
    S("progress", "overview-error", "/progress", { refuseOps: /"operationName":"LearnerProgress"/ }),
    S("review", "hub-first", "/review"),
    S("review", "hub-loading", "/review", { holdOps: REVIEW_READS }),
    S("review", "hub-error", "/review", { refuseOps: REVIEW_READS }),
    S("review", "session-empty", "/review/session"),
    S("review", "session-loading", "/review/session", { holdOps: REVIEW_READS }),
    S("review", "decks", "/review/decks"),
    S("review", "decks-none", "/review/decks", {
        act: async (p) =>
            p
                .getByRole("tab", { name: /Đã thêm/ })
                .first()
                .click()
                .catch(() => {}),
    }),
    S("review", "decks-loading", "/review/decks", { holdOps: /"operationName":"ReviewDecks"/ }),
    S("review", "decks-error", "/review/decks", { refuseOps: /"operationName":"ReviewDecks"/ }),
    S("review", "deck", { from: "/review/decks", match: /^\/review\/decks\/[^/]+$/ }),
    S("review", "deck-missing", "/review/decks/00000000-0000-4000-8000-000000000000"),
    S(
        "review",
        "deck-adding",
        { from: "review/deck", append: "?r=1" },
        { holdOps: /"operationName":"AddReviewDeck"/, act: addDeck },
    ),
    S("review", "deck-added", { from: "review/deck", append: "?r=1" }, { act: addDeck }),
    S("review", "decks-added", "/review/decks", {
        act: async (p) =>
            p
                .getByRole("button", { name: /Thêm bộ thẻ/ })
                .first()
                .click()
                .catch(() => {}),
    }),
    S("review", "hub", "/review"),
    S("review", "hub-goal", "/review", {
        act: async (p) =>
            p
                .getByText("Đổi", { exact: true })
                .first()
                .click()
                .catch(() => {}),
    }),
    S("review", "session", "/review/session"),
    S("review", "session-answer", "/review/session", { act: flipCard }),
    S("review", "session-summary", "/review/session", { act: gradeAll }),
    S("review", "hub-done", "/review"),
    S("progress", "overview", "/progress"),
    S("incidents", "list-none", "/incidents"),
    S("career", "review-queue-forbidden", "/review-queue"),
    S("career", "review-item-forbidden", "/review-queue/00000000-0000-4000-8000-000000000001"),
]
// The reads of the Essentials screens (the lessons and the topic); the shell reads stay answered, so the viewer is known while these are held or refused.
const isEssentialsRead = (route) => /"operationName":"(Lessons|LessonTopic)"/.test(route.request().postData() ?? "")
const norm = (href) => {
    try {
        const u = new URL(href, ENTRY)
        return u.pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/"
    } catch {
        return null
    }
}
;(async () => {
    const b = await chromium.launch()
    const user = await b.newContext({ storageState: stateFile })
    const guest = await b.newContext()
    const free = process.env.CAPTURE_FREE_STATE
        ? await b.newContext({ storageState: process.env.CAPTURE_FREE_STATE })
        : undefined
    // next dev's HMR socket answers every new page with a rebuild + restart (a full reload, again and again), so a shot taken during it shows the loading state.
    // Pass the socket through but drop its rebuild messages: the page loads once and stays.
    const hmrQuiet = (ws) => {
        const up = ws.connectToServer()
        up.onMessage((m) => {
            if (/"type":"(building|built|restart)"|turbopack-message/.test(String(m))) return
            ws.send(m)
        })
        ws.onMessage((m) => up.send(m))
    }
    const first = process.env.CAPTURE_FIRST_STATE
        ? await b.newContext({ storageState: process.env.CAPTURE_FIRST_STATE })
        : undefined
    await first?.routeWebSocket(/_next\/hmr/, hmrQuiet)
    await user.routeWebSocket(/_next\/hmr/, hmrQuiet)
    await guest.routeWebSocket(/_next\/hmr/, hmrQuiet)
    await free?.routeWebSocket(/_next\/hmr/, hmrQuiet)
    const resolved = {},
        report = []
    for (const s of SCREENS) {
        if (process.env.ONLY_SCREENS && !process.env.ONLY_SCREENS.split(",").includes(s.area + "/" + s.screen)) continue
        if (only && s.area !== only) continue
        if (onlyScreen && !s.screen.startsWith(onlyScreen)) continue
        let route = s.route
        if (typeof route === "object") {
            const fromPath = route.from.startsWith("/") ? route.from : resolved[route.from]
            if (!fromPath) {
                report.push(`${s.area}/${s.screen}: no parent`)
                continue
            }
            if (route.append) {
                route = fromPath + route.append
            } else {
                const p = await user.newPage()
                await p.setViewportSize({ width: 1440, height: 900 })
                await p.goto(ENTRY + fromPath, { waitUntil: "load" }).catch(() => {})
                let hrefs = []
                for (let attempt = 0; attempt < 4; attempt++) {
                    // A page that reloads or redirects after load (next dev compile, locale redirect) destroys the context: settle and read again.
                    try {
                        await p.waitForTimeout(2500)
                        hrefs = await p.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))
                        break
                    } catch {
                        await p.waitForTimeout(1500)
                    }
                }
                await p.close()
                route = hrefs.map(norm).find((h) => h && route.match.test(h))
            }
            if (!route) {
                report.push(`${s.area}/${s.screen}: no link on ${fromPath}`)
                continue
            }
        }
        resolved[`${s.area}/${s.screen}`] = route
        const dir = path.join(PAGES, s.area, s.screen)
        fs.mkdirSync(dir, { recursive: true })
        for (const w of WIDTHS) {
            // A read held or refused runs in a context of its own: the viewer cache of a shared one would answer it from an earlier screen.
            const fresh =
                s.hold || s.refuse || s.holdOps || s.refuseOps || s.cookies !== undefined
                    ? await b.newContext({ storageState: stateFile })
                    : undefined
            // A stand-in core (CAPTURE_MOCK, its origin) takes the screen's state in one call: its server-side reads carry no cookie.
            if (s.cookies !== undefined && process.env.CAPTURE_MOCK)
                await fetch(`${process.env.CAPTURE_MOCK}/__mock?${new URLSearchParams(s.cookies)}`).catch(() => {})
            if (s.cookies !== undefined)
                await fresh.addCookies(
                    Object.entries({ sid: s.screen + "-" + w + "-" + Date.now(), ...s.cookies }).map(
                        ([name, value]) => ({ name, value, domain: "localhost", path: "/" }),
                    ),
                )
            await fresh?.routeWebSocket(/_next\/hmr/, hmrQuiet)
            const p = await (
                fresh ?? (s.free ? (free ?? guest) : s.guest ? guest : s.first ? (first ?? user) : user)
            ).newPage()
            // A lane's own `next dev` port is not an allowed origin of the dev core: CAPTURE_ORIGIN_AS (the ingress origin) is sent as the Origin of its reads.
            if (process.env.CAPTURE_ORIGIN_AS)
                await p.route(/\/(graphql|api\/)/, (route) =>
                    route
                        .fetch({ headers: { ...route.request().headers(), origin: process.env.CAPTURE_ORIGIN_AS } })
                        .then(
                            (response) => route.fulfill({ response }),
                            () => route.abort(),
                        ),
                )
            // holdOps / refuseOps (a regex of GraphQL operation names) hold or refuse only those operations; everything else falls through to the routes before it.
            if (s.holdOps)
                await p.route(/graphql/, (route) =>
                    s.holdOps.test(route.request().postData() ?? "") ? undefined : route.fallback(),
                )
            if (s.refuseOps)
                await p.route(/graphql/, (route) =>
                    s.refuseOps.test(route.request().postData() ?? "") ? route.abort() : route.fallback(),
                )
            // A held read never answers, so the first load stays a skeleton; a refused read fails at once.
            if (s.hold) await p.route(/graphql/, (route) => (isEssentialsRead(route) ? undefined : route.continue()))
            if (s.refuse)
                await p.route(/graphql/, (route) => (isEssentialsRead(route) ? route.abort() : route.continue()))
            await p.setViewportSize({
                width: w,
                height: Number(process.env.CAPTURE_HEIGHT) || (w === 390 ? 844 : 900),
            })
            const res = await p
                .goto((s.origin || ENTRY) + route, { waitUntil: s.hold ? "commit" : "load" })
                .catch((e) => ({ status: () => String(e.message).slice(0, 60) }))
            if (s.clickSel) {
                await p
                    .locator(s.clickSel)
                    .first()
                    .click()
                    .catch(() => {})
                await p.waitForTimeout(800)
            }
            if (s.act) {
                await p.waitForTimeout(2500)
                await s.act(p)
            }
            if (s.fill) {
                await p
                    .locator(s.fill.sel)
                    .first()
                    .fill(s.fill.text)
                    .catch(() => {})
                await p.waitForTimeout(800)
            }
            if (s.click) {
                await p
                    .getByText(s.click, { exact: true })
                    .first()
                    .click()
                    .catch(() => {})
                await p.waitForTimeout(800)
            }
            await p.waitForTimeout(Number(process.env.CAPTURE_SETTLE) || 2500)
            {
                // The shell is one viewport tall and its panes scroll on their own (stacked panes grow on a phone, Grammar 0.37.14): grow the viewport by what any scroller still holds beyond its box (up to 4 passes, the layout settles between them) so the shot shows the whole page.
                let height = Number(process.env.CAPTURE_HEIGHT) || (w === 390 ? 844 : 900)
                for (let pass = 0; pass < 4; pass++) {
                    // next dev may reload the page (a late compile): wait for it to settle and measure again instead of failing the run.
                    const extra = await p
                        .evaluate(() =>
                            Math.max(
                                0,
                                ...[...document.querySelectorAll("*")]
                                    .filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY))
                                    .map((e) => e.scrollHeight - e.clientHeight),
                            ),
                        )
                        .catch(async () => {
                            await p.waitForTimeout(2500)
                            return 2
                        })
                    if (extra <= 1) break
                    height += extra
                    await p.setViewportSize({ width: w, height })
                    await p.waitForTimeout(700)
                }
            }
            // The Next dev indicator (the round N badge) is not part of any screen.
            await p.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
            await p.screenshot({ path: path.join(dir, `${w}.png`), fullPage: true })
            if (w === 1440) report.push(`${s.area}/${s.screen}: ${route} -> ${res?.status?.()} final ${norm(p.url())}`)
            await p.close()
        }
    }
    fs.writeFileSync(path.join(require("os").tmpdir(), "gallery-capture-report.txt"), report.join("\n") + "\n")
    console.log(report.join("\n"))
    await b.close()
})().catch((e) => {
    console.error(e)
    process.exit(1)
})
