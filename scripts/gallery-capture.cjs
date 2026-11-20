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
// Plays the five opener questions of a lesson through the product: picks[i] is "R" (the second option) or "W" (the first); "Câu tiếp theo" moves on and "Xem kết quả" ends the opener.
const playOpener = async (p, picks, isFinished) => {
    for (let i = 0; i < picks.length; i++) {
        const options = p.getByRole("radio")
        if ((await options.count()) > 0) {
            const at = picks[i] === "R" ? 1 : 0
            await options
                .nth(at)
                .check({ force: true })
                .catch(() => options.nth(at).click({ force: true }))
            await p.waitForTimeout(1800)
        }
        if (i < picks.length - 1 || isFinished) {
            await p
                .getByRole("button", { name: /^(Câu tiếp theo|Xem kết quả)$/ })
                .first()
                .click()
                .catch(() => {})
            await p.waitForTimeout(900)
        }
    }
}
// A lane server on its own port is not an origin the core api allows: CAPTURE_ORIGIN_AS (the ingress origin) is sent as the Origin of its api calls.
const originFix = async (ctx) => {
    if (!process.env.CAPTURE_ORIGIN_AS || !ctx) return
    await ctx.route(/\/(graphql|api\/)/, async (route) => {
        try {
            const response = await route.fetch({
                headers: { ...route.request().headers(), origin: process.env.CAPTURE_ORIGIN_AS },
            })
            await route.fulfill({ response })
        } catch {
            // the page closed while the call was in flight
        }
    })
}
// The review reads of the hub and the session; the deck commands the review entries press.
const REVIEW_READS = /"operationName":"(ReviewToday|ReviewStats|Streak)"/
const tap = (p, name) =>
    p
        .getByRole("button", { name })
        .first()
        .click({ timeout: 1500 })
        .then(() => true)
        .catch(() => false)
const addDeck = async (p) => {
    await p.waitForTimeout(2000)
    await tap(p, /Thêm bộ thẻ/)
    await p.waitForTimeout(3000)
    await p.mouse.move(2, 2)
    await p.waitForTimeout(1500)
}
// Opens the first deck of the list: the screen is shot on the deck page.
const openDeck = async (p) => {
    await p.waitForTimeout(2500)
    await p
        .locator('a[href*="/review/decks/"]')
        .first()
        .click({ timeout: 4000 })
        .catch(() => {})
    await p.waitForTimeout(2500)
}
const openDeckThenAdd = async (p) => {
    await openDeck(p)
    await addDeck(p)
}
// A cloze card asks for a choice per blank before it checks: pick the first choice of every blank.
const pickCloze = async (p) => {
    const groups = p.getByRole("radiogroup")
    const n = await groups.count()
    for (let i = 0; i < n; i++)
        await groups
            .nth(i)
            .getByRole("radio")
            .first()
            .click({ timeout: 1500 })
            .catch(() => {})
}
const flipCard = async (p) => {
    await p.waitForTimeout(2000)
    await pickCloze(p)
    if (!(await tap(p, /Hiện đáp án/))) {
        await p
            .locator("textarea")
            .first()
            .fill("Gõ nhanh điều nhớ được")
            .catch(() => {})
        await tap(p, /Gửi và xem đáp án mẫu/)
    }
    await p.waitForTimeout(1500)
}
const gradeAll = async (p) => {
    for (let n = 0; n < 40; n++) {
        await p.waitForTimeout(1000)
        if ((await p.getByRole("button", { name: /Hiện đáp án|Gửi và xem đáp án mẫu|^Tốt/ }).count()) === 0 && n > 0)
            return
        await flipCard(p)
        await tap(p, /^Tốt/)
    }
}
// A free learner who has reviewed one card (Ôn tập is free), so the progress page shows the free view and not the first visit.
const earnProgress = async (p) => {
    await addDeck(p)
    await p.goto(ENTRY + "/review/session", { waitUntil: "load" })
    await flipCard(p)
    await tap(p, /^Tốt/)
    await p.waitForTimeout(1500)
    await p.goto(ENTRY + "/progress", { waitUntil: "load" })
}
// The daily goal dialog with its last choice ("Khác...") picked, so the number field shows.
const openGoalOther = async (p) => {
    await p.waitForTimeout(2000)
    await p
        .getByRole("button", { name: /^Đổi$/ })
        .first()
        .click({ timeout: 3000 })
        .catch(() => {})
    await p.waitForTimeout(1000)
    await p
        .getByRole("radio", { name: /Khác/ })
        .first()
        .click({ timeout: 3000 })
        .catch(() => {})
    await p.waitForTimeout(800)
}
// The storage state of a gallery learner the seed wrote (GALLERY_STATES, default .tmp-gallery-states).
const learnerOf = (key) =>
    path.join(
        path.resolve(process.env.GALLERY_STATES || path.join(__dirname, "..", ".tmp-gallery-states")),
        key + ".json",
    )
// Opens the Claude Code & MCP view of the machines page.
const openMcpTab = async (p) => {
    await p.waitForTimeout(2500)
    await p
        .getByRole("tab", { name: /Claude Code & MCP/ })
        .first()
        .click()
        .catch(() => {})
    await p.waitForTimeout(1500)
}
// Revokes the learner's MCP tokens through the product's own commands, so the "no token yet" screens read what a fresh learner sees.
const revokeAllTokens = async (p) => {
    await p.evaluate(async () => {
        const call = (query, variables) =>
            fetch("/graphql", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ query, variables }),
            }).then((r) => r.json())
        const listed = await call("query { mcpTokens { id } }")
        for (const token of listed.data?.mcpTokens ?? [])
            await call("mutation R($input: RevokeMcpTokenInput!) { revokeMcpToken(input: $input) }", {
                input: { id: token.id },
            })
    })
    await p.reload({ waitUntil: "load" })
    await p.waitForTimeout(2500)
}
const SCREENS = [
    S("auth", "sign-in", "/sign-in", { guest: true }),
    S("auth", "sign-up", "/sign-in", { guest: true, click: "Đăng ký" }),
    S("auth", "sign-in-callback", "/sign-in/callback", { guest: true }),
    S("auth", "verify", "/verify/ABCD-2345-WXYZ", { guest: true }),
    S("landing", "home", "/", { guest: true, origin: LANDING }),
    S("landing", "not-found", "/zz-no-such-page", { guest: true, origin: LANDING }),
    // The error page needs a route that throws: a temporary page /zz-throw of the landing (not in the code) while shooting.
    S("landing", "error", "/zz-throw", { guest: true, origin: LANDING }),
    S("learn", "home", "/"),
    S("learn", "home-account-menu", "/", { clickSel: 'button[aria-label*="@"]' }),
    S("learn", "not-found", "/zz-no-such-page"),
    // The error page needs a route that throws: a temporary page /zz-throw (not in the code) while shooting.
    S("learn", "error", "/zz-throw"),
    // Inside the app chrome (the (app) group). No product route calls notFound() or throws, so each shot needs a TEMPORARY page of the (app) group while shooting, never committed:
    // /zz-missing (calls notFound()), /zz-boom (throws), /zz-slow (awaits 60 s so loading.tsx stays on screen).
    S("learn", "not-found-in-app", "/zz-missing"),
    S("learn", "error-in-app", "/zz-boom"),
    S("learn", "loading", "/zz-slow", { hold: true }),
    S("paths", "choose", "/paths/choose"),
    S("paths", "choose-loading", "/paths/choose", { hold: true, hit: "paths" }),
    S("paths", "choose-error", "/paths/choose", { refuse: true, hit: "paths" }),
    S("paths", "choose-signed-out", "/paths/choose", { guest: true }),
    // The same screen with the sign-in modal open: a state shot of choose-signed-out (modal-1440.png, modal-390.png).
    S("paths", "choose-signed-out-modal", "/paths/choose", {
        guest: true,
        clickMain: "Đăng nhập",
        dirAs: "choose-signed-out",
        prefix: "modal-",
    }),
    S("paths", "choose-detail", "/paths/choose", { clickText: "Xem lộ trình" }),
    S("essentials", "catalog", "/essentials", { state: "STU" }),
    // States of the catalog and the topic: first visit (a learner who studied nothing, CAPTURE_FIRST_STATE), a search with no match, the first read still loading (GraphQL held), the read failing (GraphQL refused), a reader without Premium.
    S("essentials", "catalog-first-visit", "/essentials", { state: "P2" }),
    S("essentials", "catalog-no-match", "/essentials", {
        fill: { sel: 'input[type="search"], input[placeholder*="Tìm"]', text: "kafka exactly" },
    }),
    S("essentials", "catalog-loading", "/essentials", { hold: true }),
    S("essentials", "catalog-error", "/essentials", { refuse: true }),
    S("essentials", "catalog-free", "/essentials", { free: true }),
    S("essentials", "topic", { from: "/essentials", match: /^\/essentials\/[^/]+$/ }, { state: "STU" }),
    S("essentials", "topic-first-visit", { from: "essentials/topic", append: "?s=1" }, { state: "P2" }),
    S("essentials", "topic-free", { from: "essentials/topic", append: "?s=1" }, { free: true }),
    S("essentials", "topic-loading", { from: "essentials/topic", append: "?s=1" }, { hold: true }),
    S("essentials", "topic-error", { from: "essentials/topic", append: "?s=1" }, { refuse: true }),
    // States of the lesson page (Bản chất and the locked parts). A scenario names its stand-in answers by cookie (plan, seed: the opener answers already given as R right and W wrong, sid) and, where the learner acts, how.
    S("essentials", "lesson", LESSON, { state: "LES", act: async (p) => playOpener(p, "RW", false) }),
    S("essentials", "lesson-question-1", LESSON, { state: "P2" }),
    S("essentials", "lesson-loading", LESSON, { hold: true }),
    S("essentials", "lesson-error", LESSON, { refuse: true }),
    S("essentials", "lesson-result", LESSON, { state: "RES", act: async (p) => playOpener(p, "RWRRW", true) }),
    S("essentials", "lesson-article", LESSON, {
        state: "ART",
        act: async (p) => {
            await playOpener(p, "RWRRW", true)
            await p
                .getByRole("button", { name: /Đọc bài viết/ })
                .first()
                .click()
                .catch(() => {})
        },
    }),
    S("essentials", "lesson-free-end", LESSON, {
        state: "FEND",
        act: async (p) => {
            await playOpener(p, "RWRRW", true)
            for (const name of [/Đọc bài viết/, /Làm lại 5 câu/]) {
                await p
                    .getByRole("button", { name })
                    .first()
                    .click()
                    .catch(() => {})
                await p.waitForTimeout(900)
            }
            await playOpener(p, "RRRRR", true)
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
    S("essentials", "lesson-ladder-locked", LESSON + "?part=apply"),
    // practice: the disposable learner has no progress, so the plain screens are the first-visit ones; the held, refused and searched states stand on that.
    S("practice", "list", "/practice"),
    S("practice", "list-first", "/practice"),
    S("practice", "list-nomatch", "/practice", {
        act: async (p) => {
            await p.getByPlaceholder(/Tìm pattern/).fill("cây khoảng")
            await p.waitForTimeout(1200)
        },
    }),
    S("practice", "list-loading", "/practice", { hold: true, ops: /"operationName":"Practice/ }),
    S("practice", "list-error", "/practice", { refuse: true, ops: /"operationName":"Practice/ }),
    S("practice", "pattern", "/practice/patterns/arrays"),
    S("practice", "pattern-first", "/practice/patterns/arrays"),
    S("practice", "pattern-loading", "/practice/patterns/arrays", { hold: true, ops: /"operationName":"Practice/ }),
    S("practice", "pattern-error", "/practice/patterns/arrays", { refuse: true, ops: /"operationName":"Practice/ }),
    S("practice", "problem", { from: "/practice/patterns/arrays", match: /^\/practice\/(?!patterns)[^/]+$/ }),
    S(
        "practice",
        "problem-confirm",
        { from: "practice/problem", append: "#s" },
        {
            act: async (p) => {
                await p.getByRole("tab", { name: "Lời giải" }).click()
                await p.getByRole("button", { name: "Xem lời giải" }).first().click()
                await p.waitForTimeout(800)
            },
        },
    ),
    S(
        "practice",
        "problem-loading",
        { from: "practice/problem", append: "#s" },
        { hold: true, ops: /"operationName":"Practice/ },
    ),
    S(
        "practice",
        "problem-error",
        { from: "practice/problem", append: "#s" },
        { refuse: true, ops: /"operationName":"Practice/ },
    ),
    S("projects", "list", "/projects"),
    S("projects", "new", "/projects/new"),
    S("projects", "detail", { from: "/projects", match: /^\/projects\/[0-9a-f-]{36}$/ }),
    S("projects", "milestone", { from: "projects/detail", match: /^\/projects\/[0-9a-f-]{36}\/[^/]+$/ }),
    S("projects", "concept", { from: "projects/milestone", match: /^\/projects\/[0-9a-f-]{36}\/[^/]+\/[^/]+$/ }),
    // A signed-in reader without Premium (CAPTURE_FREE_STATE) sees the pitch; without the file the shot falls back to the guest context.
    S("projects", "paywall", "/projects", { free: true }),
    // ---- next-ux-career (real dev data only; a read is only held or refused, never answered)
    S("harness", "hub", "/harness"),
    S("harness", "hub-loading", "/harness", { hold: true, ops: /"operationName":"HarnessHub"/ }),
    S("harness", "hub-error", "/harness", { refuse: true, ops: /"operationName":"HarnessHub"/ }),
    S("harness", "builds", "/harness/build"),
    S("harness", "builds-loading", "/harness/build", { hold: true, ops: /"operationName":"HarnessBuilds"/ }),
    S("harness", "builds-error", "/harness/build", { refuse: true, ops: /"operationName":"HarnessBuilds"/ }),
    S("harness", "build", "/harness/build/agent-cli"),
    S("harness", "build-loading", "/harness/build/agent-cli", { hold: true, ops: /"operationName":"HarnessBuild"/ }),
    S("harness", "build-error", "/harness/build/agent-cli", { refuse: true, ops: /"operationName":"HarnessBuild"/ }),
    S("harness", "guide", "/harness/use/claude/hooks"),
    S("harness", "guide-loading", "/harness/use/claude/hooks", { hold: true, ops: /"operationName":"HarnessGuide"/ }),
    S("harness", "guide-error", "/harness/use/claude/hooks", { refuse: true, ops: /"operationName":"HarnessGuide"/ }),
    S("harness", "docs", "/harness/docs"),
    S("harness", "docs-loading", "/harness/docs", { hold: true, ops: /"operationName":"HarnessDocs"/ }),
    S("harness", "docs-error", "/harness/docs", { refuse: true, ops: /"operationName":"HarnessDocs"/ }),
    S("harness", "doc", "/harness/docs/overview"),
    S("harness", "doc-loading", "/harness/docs/overview", { hold: true, ops: /"operationName":"HarnessDoc"/ }),
    S("harness", "doc-error", "/harness/docs/overview", { refuse: true, ops: /"operationName":"HarnessDoc"/ }),
    S("harness", "use", "/harness/use"),
    S("harness", "use-loading", "/harness/use", {
        hold: true,
        ops: /"operationName":"(HarnessGuides|HarnessDoctor|HarnessTrials)"/,
    }),
    S("harness", "use-error", "/harness/use", {
        refuse: true,
        ops: /"operationName":"(HarnessGuides|HarnessDoctor|HarnessTrials)"/,
    }),
    S("career", "experience-first-visit", "/experience"),
    S("career", "experience-loading", "/experience", { hold: true, ops: /"operationName":"MyExperience"/ }),
    S("career", "experience-error", "/experience", { refuse: true, ops: /"operationName":"MyExperience"/ }),
    S("career", "verify", "/verify/9C2E-F88F-B6BA", { guest: true }),
    S("career", "verify-not-found", "/verify/SC-0000", { guest: true }),
    S("career", "verify-loading", "/verify/SC-0000", {
        guest: true,
        hold: true,
        ops: /"operationName":"VerifyExperience"/,
    }),
    S("career", "verify-error", "/verify/SC-0000", {
        guest: true,
        refuse: true,
        ops: /"operationName":"VerifyExperience"/,
    }),
    // The seeded learner of career-states shares one verified line (scripts/gallery-seed.mjs --only career-states,career-teacher).
    S("cv", "public-few-lines", "/cv/gallery-career-states-example-test", { guest: true }),
    S("cv", "public-share", "/cv/gallery-career-states-example-test", {
        guest: true,
        act: async (p) => {
            await p
                .getByRole("button", { name: "Chia sẻ CV" })
                .first()
                .click()
                .catch(() => {})
            await p.waitForTimeout(800)
        },
    }),
    S("cv", "public-not-found", "/cv/khong-co-cv-nay", { guest: true }),
    S("profile", "overview", "/profile"),
    S("profile", "new", "/profile", {
        learnerState: "D:/starci-lanes/next-gallery-seed/.tmp-gallery-states/review-nothing.json",
    }),
    S("profile", "edit", "/profile/edit"),
    S("profile", "edit-loading", "/profile/edit", { hold: true, ops: /"operationName":"MyProfile"/ }),
    S("profile", "edit-error", "/profile/edit", { refuse: true, ops: /"operationName":"MyProfile"/ }),
    // --- next-ux-commerce: Premium, the checkout result, the machines and the AI connector. Each shot is a seeded gallery learner on the dev stack's real data.
    // premium-qr-payment, premium-qr-expired, premium-result-failed, premium-result-expired and devices/list-limit-reached have no shot: the QR data, a failed or expired order and a free learner with a machine are not on the dev stack (pending-seed).
    S("commerce", "premium", "/premium", { learnerState: learnerOf("review-nothing") }),
    S("commerce", "premium-loading", "/premium", {
        learnerState: learnerOf("review-nothing"),
        holdOps: /"operationName":"PremiumPlans"/,
    }),
    S("commerce", "premium-has-premium", "/premium", { learnerState: learnerOf("scenarios-none") }),
    S("commerce", "premium-checkout-error", "/premium", {
        learnerState: learnerOf("review-nothing"),
        refuseOps: /"operationName":"StartPremiumCheckout"/,
        act: async (p) => {
            await tap(p, /^Thanh toán/)
            await p.waitForTimeout(1500)
        },
    }),
    S("commerce", "premium-result", "/premium/result", {
        learnerState: learnerOf("review-nothing"),
        act: async (p) => {
            // A real order: the product's own command starts one, and the result page is opened on the order it made (the gateway page it would leave for is not this screen).
            const order = await p.evaluate(async () => {
                const call = (query, variables) =>
                    fetch("/graphql", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ query, variables }),
                    }).then((r) => r.json())
                const plans = await call("query { premiumPlans { plan } }")
                const plan = plans.data?.premiumPlans?.[0]?.plan
                const made = await call(
                    "mutation S($input: StartPremiumCheckoutInput!) { startPremiumCheckout(input: $input) { orderId } }",
                    { input: { plan } },
                )
                return made.data?.startPremiumCheckout?.orderId
            })
            if (order) {
                await p.goto(ENTRY + "/premium/result?order=" + order, { waitUntil: "load" })
                await p.waitForTimeout(2500)
            }
        },
    }),
    S("commerce", "premium-result-unlocked", "/premium/result", { learnerState: learnerOf("scenarios-none") }),
    S("devices", "list-empty", "/devices", { learnerState: learnerOf("review-nothing") }),
    S("devices", "list-error", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        refuseOps: /"operationName":"RelayDevices"/,
    }),
    S("devices", "list-offline-device", "/devices", { learnerState: learnerOf("scenarios-red") }),
    S("devices", "list-enter-code-dialog", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            await tap(p, /^Kết nối máy$/)
            await p.waitForTimeout(1200)
        },
    }),
    S("devices", "list-code-invalid-dialog", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            await tap(p, /^Kết nối máy$/)
            await p.waitForTimeout(800)
            await p.getByLabel(/Mã 8 ký tự/).fill("K7QM-4821")
            await p.waitForTimeout(2500)
        },
    }),
    S("devices", "list-preview-device-dialog", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            // A real pending pairing: a machine starts one the way the learner CLI does, and the learner types its code.
            const started = await fetch(
                (process.env.CAPTURE_CORE || "http://127.0.0.1:3201") + "/api/relay/devices/start",
                {
                    method: "POST",
                    headers: { "content-type": "application/json", origin: process.env.CAPTURE_ORIGIN_AS || ENTRY },
                    body: JSON.stringify({ deviceName: "MacBook Pro của Lan", platform: "macos" }),
                },
            ).then((r) => r.json())
            await tap(p, /^Kết nối máy$/)
            await p.waitForTimeout(800)
            await p.getByLabel(/Mã 8 ký tự/).fill(started.userCode)
            await p.waitForTimeout(2500)
        },
    }),
    S("devices", "list-mcp-no-token", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            await revokeAllTokens(p)
            await openMcpTab(p)
        },
    }),
    S("devices", "list-mcp-token-created", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            await revokeAllTokens(p)
            await openMcpTab(p)
            await tap(p, /^Tạo token$/)
            await p.waitForTimeout(800)
            await p.getByLabel(/Tên token/).fill("Claude Code trên MacBook")
            await p
                .getByRole("dialog")
                .getByRole("button", { name: /^Tạo token$/ })
                .click()
            await p.waitForTimeout(2500)
        },
    }),
    S("devices", "list-mcp-tokens", "/devices", {
        learnerState: learnerOf("scenarios-none"),
        act: async (p) => {
            // One token, secret already dismissed: the list as it reads on a later visit.
            await revokeAllTokens(p)
            await openMcpTab(p)
            await tap(p, /^Tạo token$/)
            await p.waitForTimeout(800)
            await p.getByLabel(/Tên token/).fill("Claude Code trên MacBook")
            await p
                .getByRole("dialog")
                .getByRole("button", { name: /^Tạo token$/ })
                .click()
            await p.waitForTimeout(2000)
            await tap(p, /^Tôi đã lưu token$/)
            await p.waitForTimeout(1000)
        },
    }),
    S("devices", "list", "/devices", { learnerState: learnerOf("scenarios-none") }),
    S("connect", "ai", "/connect", { learnerState: learnerOf("scenarios-red"), act: revokeAllTokens }),
    S("connect", "ai-token-created", "/connect", {
        learnerState: learnerOf("scenarios-red"),
        act: async (p) => {
            await revokeAllTokens(p)
            await p.getByLabel(/Tên mã/).fill("Claude")
            await tap(p, /^Tạo mã$/)
            await p.waitForTimeout(2500)
            // The disabled Tạo mã keeps focus and its tooltip: leave it before the shot.
            await p.evaluate(() => document.activeElement?.blur())
            await p.mouse.move(2, 2)
            await p.waitForTimeout(800)
        },
    }),
    S("connect", "ai-tokens-error", "/connect", {
        learnerState: learnerOf("scenarios-red"),
        refuseOps: /"operationName":"McpTokens"/,
    }),
    // --- next-ux-review: review, progress, incidents and the review queue. The entries run in order against ONE learner: the first states are shot before any deck is added, then a deck is added and reviewed.
    S("progress", "overview-first-visit", "/progress"),
    S("progress", "overview-loading", "/progress", { holdOps: /"operationName":"LearnerProgress"/ }),
    S("progress", "overview-page-error", "/progress", { refuseOps: /"operationName":"LearnerProgress"/ }),
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
    S("review", "deck", "/review/decks", { act: openDeck }),
    S("review", "deck-missing", "/review/decks/00000000-0000-4000-8000-000000000000"),
    S(
        "review",
        "deck-adding",
        { from: "review/deck", append: "?r=1" },
        { holdOps: /"operationName":"AddReviewDeck"/, act: addDeck },
    ),
    S("review", "deck-added", "/review/decks", { act: openDeckThenAdd }),
    S("review", "decks-added", "/review/decks", { act: addDeck }),
    S("review", "hub", "/review"),
    S("review", "hub-goal", "/review", { act: openGoalOther }),
    S("review", "session", "/review/session"),
    S("review", "session-cloze", "/review/session", { act: pickCloze }),
    S("review", "session-answer", "/review/session", { act: flipCard }),
    S("review", "session-summary", "/review/session", { act: gradeAll }),
    S("review", "hub-done", "/review"),
    S("progress", "overview", "/progress"),
    S("progress", "free", "/review/decks", { free: true, act: earnProgress }),
    S("incidents", "list-none", "/incidents"),
    S("career", "review-queue-forbidden", "/review-queue"),
    S("career", "review-item-forbidden", "/review-queue/00000000-0000-4000-8000-000000000001"),
]
// Seeded states (scripts/gallery-seed.mjs, run first; it writes manifest.json and a storage state per gallery learner into GALLERY_STATES, default .tmp-gallery-states):
// a screen the manifest names is shot as that learner on the dev stack's real data, not through a stand-in core. Keep the seed running with --hold so its devices stay online.
const STATES_DIR = path.resolve(process.env.GALLERY_STATES || path.join(__dirname, "..", ".tmp-gallery-states"))
const SEEDED = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(STATES_DIR, "manifest.json"), "utf8"))
    } catch {
        return undefined
    }
})()
if (SEEDED) {
    for (const [id, seeded] of Object.entries(SEEDED.screens)) {
        const [area, screen] = id.split("/")
        if (!screen || /[ (]/.test(screen)) continue
        const route = seeded.route.split(" ")[0]
        const extra = {
            ...(seeded.guest ? { guest: true } : { learnerState: path.join(STATES_DIR, seeded.learner + ".json") }),
            ...(id === "career/review-queue-reviewers" ? { click: "Người duyệt" } : {}),
            // A free learner with one machine pairs a second one: the dialog answers with the plan's limit (a real refusal of the core).
            ...(id === "devices/list-limit-reached"
                ? {
                      act: async (p) => {
                          const started = await fetch(
                              (process.env.CAPTURE_CORE || "http://127.0.0.1:3201") + "/api/relay/devices/start",
                              {
                                  method: "POST",
                                  headers: {
                                      "content-type": "application/json",
                                      origin: process.env.CAPTURE_ORIGIN_AS || ENTRY,
                                  },
                                  body: JSON.stringify({ deviceName: "Máy thứ hai", platform: "macos" }),
                              },
                          ).then((r) => r.json())
                          await tap(p, /^Kết nối máy$/)
                          await p.waitForTimeout(800)
                          await p.getByLabel(/Mã 8 ký tự/).fill(started.userCode)
                          await p.waitForTimeout(2500)
                          await p
                              .getByRole("dialog")
                              .getByRole("button", { name: /^Xác nhận kết nối$/ })
                              .click()
                          await p.waitForTimeout(2500)
                      },
                  }
                : {}),
            ...(id === "review/session-conflict"
                ? {
                      act: async (p) => {
                          await p
                              .getByRole("button", { name: /Hiện đáp án/ })
                              .first()
                              .click()
                          await p.waitForTimeout(1500)
                          // The second device: another session of the same learner grades the same card "good" first.
                          require("child_process").spawnSync(
                              process.execPath,
                              [path.join(__dirname, "gallery-seed.mjs"), "--grade-elsewhere", "--out", STATES_DIR],
                              { stdio: "inherit" },
                          )
                          await p.getByRole("button", { name: /^Lại/ }).first().click()
                          await p.waitForTimeout(1500)
                      },
                  }
                : {}),
        }
        const at = SCREENS.findIndex((each) => each.area === area && each.screen === screen)
        if (at === -1) SCREENS.push(S(area, screen, route, extra))
        else SCREENS[at] = S(area, screen, route, extra)
    }
}
// The reads of the Essentials screens (the lessons and the topic); the shell reads stay answered, so the viewer is known while these are held or refused.
const isEssentialsRead = (route, hit) =>
    (hit === "paths" ? /"operationName":"OutcomePaths"/ : /"operationName":"(Lessons|LessonTopic|Lesson)"/).test(
        route.request().postData() ?? "",
    )
// A screen may name the operations its held or refused read stands for (ops: a regexp over the operation names); else the Essentials reads.
// The core API accepts one browser origin (the ingress); a lane's own next dev on another port sends its reads as that origin (CAPTURE_ORIGIN_AS=http://localhost:3280).
const ORIGIN_AS = process.env.CAPTURE_ORIGIN_AS
const spoof = async (route) => {
    if (!ORIGIN_AS) return route.continue()
    // The page's own Origin cannot be changed in flight, so the read is made again from here with the accepted one and its answer handed back.
    const answer = await route.fetch({ headers: { ...route.request().headers(), origin: ORIGIN_AS } })
    return route.fulfill({ response: answer })
}
const isHeldRead = (route, s) => (s.ops ? s.ops.test(route.request().postData() ?? "") : isEssentialsRead(route, s.hit))
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
    for (const c of [user, guest, free]) await originFix(c)
    const first = process.env.CAPTURE_FIRST_STATE
        ? await b.newContext({ storageState: process.env.CAPTURE_FIRST_STATE })
        : undefined
    await originFix(first)
    await first?.routeWebSocket(/_next\/hmr/, hmrQuiet)
    if (ORIGIN_AS) for (const c of [user, guest, free, first]) await c?.route(/graphql/, spoof)
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
        const dir = path.join(PAGES, s.area, s.dirAs || s.screen)
        fs.mkdirSync(dir, { recursive: true })
        for (const w of WIDTHS) {
            // A read held or refused runs in a context of its own: the viewer cache of a shared one would answer it from an earlier screen.
            const fresh =
                s.hold ||
                s.refuse ||
                s.holdOps ||
                s.refuseOps ||
                s.cookies !== undefined ||
                s.state !== undefined ||
                s.learnerState !== undefined
                    ? await b.newContext({
                          storageState: s.learnerState
                              ? s.learnerState
                              : s.state
                                ? (process.env["CAPTURE_STATE_" + s.state + "_" + w] ??
                                  process.env["CAPTURE_STATE_" + s.state])
                                : s.free && process.env.CAPTURE_FREE_STATE
                                  ? process.env.CAPTURE_FREE_STATE
                                  : stateFile,
                      })
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
            await originFix(fresh)
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
            if (s.hold) await p.route(/graphql/, (route) => (isHeldRead(route, s) ? undefined : spoof(route)))
            if (s.refuse) await p.route(/graphql/, (route) => (isHeldRead(route, s) ? route.abort() : spoof(route)))
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
            if (s.clickMain) {
                await p
                    .locator("main")
                    .getByRole("button", { name: s.clickMain, exact: true })
                    .first()
                    .click()
                    .catch(() => {})
                await p.waitForTimeout(1500)
            }
            if (s.clickText) {
                await p
                    .getByRole("button", { name: s.clickText })
                    .first()
                    .click()
                    .catch(() => {})
                await p.mouse.move(2, 2)
                await p.waitForTimeout(1000)
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
            await p.screenshot({ path: path.join(dir, `${s.prefix || ""}${w}.png`), fullPage: true })
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
