// Captures every screen of the app at 1440 and 390 into gallery/pages/<area>/<screen>/<width>.png.
// Dynamic routes take the first link the list screen shows. usage: node scripts/integration/gallery-capture.mjs [state.json] [area-filter] [screen] (state.json, a .json path, may be left out for a guest-only run)
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const { chromium } = createRequire(import.meta.url)(
    process.env.PLAYWRIGHT_MODULE || "D:/starci-tmp/pw-tool/node_modules/playwright",
)
const here = path.dirname(fileURLToPath(import.meta.url))
// The dev entry origin and the landing of the stack (environments.dev.local.ports: ingress 3280, landing 3202); override with CAPTURE_ENTRY / CAPTURE_LANDING.
const ENTRY = process.env.CAPTURE_ENTRY || "http://localhost:3280"
const LANDING = process.env.CAPTURE_LANDING || "http://localhost:3202"
// The state file is the first argument only when it is a .json path; a guest-only run leaves it out: gallery-capture.mjs auth [screen].
const argv = process.argv.slice(2)
const stateFile = argv[0]?.endsWith(".json") ? argv[0] : undefined
const [only, onlyScreen] = stateFile === undefined ? argv : argv.slice(1)
const PAGES = path.join(here, "..", "..", "gallery", "pages")
const WIDTHS = process.env.CAPTURE_WIDTHS ? process.env.CAPTURE_WIDTHS.split(",").map(Number) : [1440, 390]
const S = (area, screen, route, extra = {}) => ({ area, screen, route, ...extra })
// Signs a learner in through the app's own doors (gallery-sign-in.mjs, which signs a new one up and confirms the link read from the mail
// sink) into a storage state of its own. Answers the path of that state.
const signInAs = (email, password) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gallery-learner-"))
    const credentials = path.join(dir, "credentials.json")
    const state = path.join(dir, "state.json")
    fs.writeFileSync(credentials, JSON.stringify({ email, password }))
    const signed = spawnSync(process.execPath, [path.join(here, "gallery-sign-in.mjs"), credentials, state], {
        stdio: "inherit",
    })
    fs.rmSync(credentials)
    if (signed.status !== 0) throw new Error(`${email} could not sign in`)
    return state
}
// A seeded learner signed in anew for one shot (the seed keeps its password beside the states): a shot that acts long enough to rotate the
// session's refresh token leaves the seed's saved state spent for the next width.
const seededAgain = (key) => () =>
    signInAs(`gallery-${key}@example.test`, JSON.parse(fs.readFileSync(learnerOf("passwords"), "utf8"))[key])
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
// A cloze card asks for a choice per blank (a Select each) before it checks: pick the first choice of every blank.
const pickCloze = async (p) => {
    const triggers = p.locator(".starci-core-select-trigger")
    const n = await triggers.count()
    for (let i = 0; i < n; i++) {
        await triggers
            .nth(i)
            .click({ timeout: 1500 })
            .catch(() => {})
        await p
            .getByRole("option")
            .first()
            .click({ timeout: 1500 })
            .catch(() => {})
    }
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
        .getByRole("dialog")
        .locator(".starci-core-select-trigger")
        .first()
        .click({ timeout: 3000 })
        .catch(() => {})
    await p
        .getByRole("option", { name: /Khác/ })
        .first()
        .click({ timeout: 3000 })
        .catch(() => {})
    await p.waitForTimeout(800)
}
// The storage state of a gallery learner the seed wrote (GALLERY_STATES, default .tmp-gallery-states).
const learnerOf = (key) =>
    path.join(
        path.resolve(process.env.GALLERY_STATES || path.join(here, "..", "..", ".tmp-gallery-states")),
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
// The auth board states play the doors through the product's own form; the emailed-link states read the link from the loopback mail sink (CAPTURE_MAIL).
const CORE = process.env.CAPTURE_CORE || "http://localhost:3201"
const MAIL = process.env.CAPTURE_MAIL || "http://localhost:3292"
// These states create accounts and read a mail sink: refuse anything but loopback.
for (const [name, value] of [
    ["CAPTURE_CORE", CORE],
    ["CAPTURE_MAIL", MAIL],
])
    if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(new URL(value).hostname)) {
        console.error(
            `gallery-capture: refusing ${name}=${value}: the auth states sign learners up on a loopback stack only`,
        )
        process.exit(1)
    }
// A confirmed learner for the wrong-password shot: GALLERY_STATES/cred.json ({ email }), the one gallery-sign-in made.
const knownEmail = () => {
    try {
        return JSON.parse(fs.readFileSync(learnerOf("cred"), "utf8")).email
    } catch {
        return "gallery-fresh@example.test"
    }
}
// A new disposable address per shot: a link is used once, so every width signs up its own learner.
const freshEmail = () => `gallery-auth-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.test`
const STAND_IN_PASSWORD = "gallery-" + Math.random().toString(36).slice(2, 12)
const fillForm = async (p, values) => {
    for (const [name, value] of Object.entries(values))
        await p
            .locator(`input[name="${name}"]`)
            .first()
            .fill(value, { timeout: 4000 })
            .catch(() => {})
}
const acceptTerms = (p) =>
    p
        .getByRole("checkbox")
        .first()
        .check({ force: true, timeout: 3000 })
        .catch(() => {})
const submitForm = async (p) => {
    await p
        .locator('form button[type="submit"]')
        .first()
        .click({ timeout: 4000 })
        .catch(() => {})
    await p.waitForTimeout(2500)
}
const openMode = async (p, name) => {
    await p.waitForTimeout(1500)
    await p
        .getByText(name, { exact: true })
        .first()
        .click({ timeout: 4000 })
        .catch(() => {})
    // The pointer leaves the card, so no hover look or tooltip of the control that took its place is shot.
    await p.mouse.move(2, 2)
    await p.waitForTimeout(800)
}
// Signs a learner up through the core door (the account stays unconfirmed) and answers the address.
const signUpAtCore = async (email) => {
    const answer = await fetch(CORE + "/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json", origin: process.env.CAPTURE_ORIGIN_AS || ENTRY },
        body: JSON.stringify({ email, password: STAND_IN_PASSWORD, language: "vi" }),
    })
    if (!answer.ok) throw new Error(`sign-up refused (${answer.status}) for the stand-in learner`)
    return email
}
// The token of the newest link of a kind (confirm or reset) the mail sink holds for an address.
const mailedToken = async (email, kind) => {
    for (let attempt = 0; attempt < 30; attempt++) {
        const list = await (await fetch(`${MAIL}/api/v1/search?query=${encodeURIComponent("to:" + email)}`)).json()
        for (const message of list.messages ?? []) {
            const full = await (await fetch(`${MAIL}/api/v1/message/${message.ID}`)).json()
            const token = new RegExp(`/auth/${kind}\\?token=([A-Za-z0-9_-]+)`).exec(
                `${full.HTML ?? ""} ${full.Text ?? ""}`,
            )?.[1]
            if (token) return token
        }
        await new Promise((done) => setTimeout(done, 500))
    }
    return undefined
}
const AUTH_STATES = [
    S("auth", "sign-in-wrong-password", "/sign-in", {
        guest: true,
        act: async (p) => {
            await p.waitForTimeout(1500)
            await fillForm(p, { email: knownEmail(), password: STAND_IN_PASSWORD + "-wrong" })
            await submitForm(p)
        },
    }),
    S("auth", "sign-up-validation-error", "/sign-in", {
        guest: true,
        act: async (p) => {
            await openMode(p, "Đăng ký")
            await fillForm(p, { email: freshEmail(), password: "short", confirm: "shorter" })
            await acceptTerms(p)
            await submitForm(p)
        },
    }),
    S("auth", "sent", "/sign-in", {
        guest: true,
        act: async (p) => {
            await openMode(p, "Đăng ký")
            await fillForm(p, { email: freshEmail(), password: STAND_IN_PASSWORD, confirm: STAND_IN_PASSWORD })
            await acceptTerms(p)
            await submitForm(p)
        },
    }),
    S("auth", "sent-resent", "/sign-in", {
        guest: true,
        act: async (p) => {
            await openMode(p, "Đăng ký")
            await fillForm(p, { email: freshEmail(), password: STAND_IN_PASSWORD, confirm: STAND_IN_PASSWORD })
            await acceptTerms(p)
            await submitForm(p)
            await tap(p, /^Gửi lại email$/)
            await p.waitForTimeout(2500)
        },
    }),
    S("auth", "sent-not-confirmed", "/sign-in", {
        guest: true,
        act: async (p) => {
            const email = await signUpAtCore(freshEmail())
            await p.waitForTimeout(1500)
            await fillForm(p, { email, password: STAND_IN_PASSWORD })
            await submitForm(p)
        },
    }),
    S("auth", "confirm", "/sign-in", {
        guest: true,
        act: async (p) => {
            const email = await signUpAtCore(freshEmail())
            const token = await mailedToken(email, "confirm")
            // No mail means no real link: fail the shot instead of saving an "invalid link" page as auth/confirm.
            if (token === undefined) throw new Error("no confirmation mail reached the sink")
            await p.goto(ENTRY + "/sign-in/confirm?token=" + token, { waitUntil: "load" })
            await p.waitForTimeout(3000)
        },
    }),
    S("auth", "forgot", "/sign-in", {
        guest: true,
        // The form at rest: the mode switch focuses the email field, so the shot drops the focus.
        act: async (p) => {
            await openMode(p, "Quên mật khẩu?")
            await p.evaluate(() => document.activeElement?.blur())
            await p.waitForTimeout(400)
        },
    }),
    S("auth", "forgot-sent", "/sign-in", {
        guest: true,
        act: async (p) => {
            await openMode(p, "Quên mật khẩu?")
            // A new address per shot: the forgot door limits repeats per address, and it answers "sent" for any address.
            await fillForm(p, { email: freshEmail() })
            await submitForm(p)
        },
    }),
    S("auth", "reset-error", "/sign-in/reset?token=gallery-capture-0000", {
        guest: true,
        act: async (p) => {
            await p.waitForTimeout(1500)
            await fillForm(p, { password: STAND_IN_PASSWORD, confirm: STAND_IN_PASSWORD + "x" })
            await submitForm(p)
        },
    }),
    S("auth", "reset-expired", "/sign-in/reset?token=gallery-capture-0000", {
        guest: true,
        act: async (p) => {
            await p.waitForTimeout(1500)
            await fillForm(p, { password: STAND_IN_PASSWORD, confirm: STAND_IN_PASSWORD })
            await submitForm(p)
        },
    }),
    S("auth", "forgot-sign-in-after-reset", "/sign-in?reset=1", { guest: true }),
]
const SCREENS = [
    S("auth", "sign-in", "/sign-in", { guest: true }),
    S("auth", "sign-up", "/sign-in", { guest: true, click: "Đăng ký" }),
    // The emailed links of the auth doors: the page opens with the token in the query (a 16+ character stand-in, so the door answers the invalid-link state).
    S("auth", "confirm-expired", "/sign-in/confirm?token=gallery-capture-0000", { guest: true }),
    S("auth", "reset", "/sign-in/reset?token=gallery-capture-0000", { guest: true }),
    ...AUTH_STATES,
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
    // Essentials: the course catalog and the first lab lesson it lists, as the seed's Premium learner signed in anew for each shot.
    S("essentials", "catalog", "/essentials", { learnerState: seededAgain("scenarios-none") }),
    S(
        "essentials",
        "lesson",
        { from: "/essentials", match: /^\/essentials\/[^/]+\/[^/]+$/ },
        { learnerState: seededAgain("scenarios-none") },
    ),
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
    // The seeded learner with eleven verified lines from three sources (gallery-seed cv-eight): the source chips and "Xem thêm" show; its slug is learners.cv-eight.cv.slug.
    S("cv", "public-many-lines", "/cv/minh-nguyen", { guest: true }),
    S("cv", "public-loading", "/cv/learner-4", { guest: true, hold: true, ops: /"operationName":"PublicCv"/ }),
    // The learner with three verified lines and a CV (gallery-seed cv-multi): the overview is the settled, filled profile.
    S("profile", "overview", "/profile", { learnerState: learnerOf("cv-multi") }),
    S("profile", "new", "/profile", {
        learnerState: learnerOf("review-nothing"),
    }),
    // The filled profile while its reads are held, and with the experience read refused (the other regions still draw).
    S("profile", "overview-loading", "/profile", {
        learnerState: learnerOf("cv-multi"),
        hold: true,
        ops: /"operationName":"(MyProfile|MyCvLink|MyExperience|LearnerProgress|RelayDevices|MyPremium)"/,
    }),
    S("profile", "overview-partial-error", "/profile", {
        learnerState: learnerOf("cv-multi"),
        refuse: true,
        ops: /"operationName":"MyExperience"/,
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
    // Dev now holds a written incident: list is the real answer; list-none is that answer with no incident written yet.
    S("incidents", "list", "/incidents"),
    S("incidents", "list-loading", "/incidents", { hold: true, ops: /"operationName":"Incidents"/ }),
    S("incidents", "list-error", "/incidents", { refuse: true, ops: /"operationName":"Incidents"/ }),
    S("incidents", "list-none", "/incidents", {
        reshape: {
            ops: /"operationName":"Incidents"/,
            map: (body) => ({
                ...body,
                data: { incidents: (body.data?.incidents ?? []).map((row) => ({ ...row, incidentAvailable: false })) },
            }),
        },
    }),
    S("career", "review-queue-forbidden", "/review-queue"),
    S("career", "review-item-forbidden", "/review-queue/00000000-0000-4000-8000-000000000001"),
    // The teacher queue in its other states: the real ReviewQueue answer held (loading), refused (error) or emptied (nothing yet to review).
    S("career", "review-queue-loading", "/review-queue", {
        learnerState: learnerOf("career-teacher"),
        hold: true,
        ops: /"operationName":"ReviewQueue"/,
    }),
    S("career", "review-queue-error", "/review-queue", {
        learnerState: learnerOf("career-teacher"),
        refuse: true,
        ops: /"operationName":"ReviewQueue"/,
    }),
    S("career", "review-queue-nothing", "/review-queue", {
        learnerState: learnerOf("career-teacher"),
        reshape: {
            ops: /"operationName":"ReviewQueue"/,
            map: (body) => ({
                ...body,
                data: {
                    reviewQueue: {
                        ...body.data?.reviewQueue,
                        counts: { pending: 0, overdue: 0, unassigned: 0 },
                        items: [],
                    },
                },
            }),
        },
    }),
    // One item of the seeded teacher queue while its read is held.
    S("career", "review-item-loading", "/review-queue/ae894d4c-4182-4ec3-9851-dedf2a1a2410", {
        learnerState: learnerOf("career-teacher"),
        hold: true,
        ops: /"operationName":"ReviewItem"/,
    }),
    // The public CV of the seeded cv-multi learner when its read is refused.
    S("cv", "public-error", "/cv/learner-4", { guest: true, refuse: true, ops: /"operationName":"PublicCv"/ }),
]
// Seeded states (scripts/integration/gallery-seed.mjs, run first; it writes manifest.json and a storage state per gallery learner into GALLERY_STATES, default .tmp-gallery-states):
// a screen the manifest names is shot as that learner on the dev stack's real data, not through a stand-in core. Keep the seed running with --hold so its devices stay online.
const STATES_DIR = path.resolve(process.env.GALLERY_STATES || path.join(here, "..", "..", ".tmp-gallery-states"))
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
                          spawnSync(
                              process.execPath,
                              [path.join(here, "gallery-seed.mjs"), "--grade-elsewhere", "--out", STATES_DIR],
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
    // No state file (a guest-only run): the signed-in context is an anonymous one, and only the guest screens are meaningful.
    const user = await b.newContext(stateFile ? { storageState: stateFile } : {})
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
                          // learnerState is a storage state path, or a function that makes one for this width (a learner of its own per shot).
                          storageState: s.learnerState
                              ? typeof s.learnerState === "function"
                                  ? s.learnerState()
                                  : s.learnerState
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
            // reshape { ops, map }: the real answer of those operations, passed through map (a state the dev data no longer holds, drawn from its own shape).
            if (s.reshape)
                await p.route(/graphql/, async (route) => {
                    if (!s.reshape.ops.test(route.request().postData() ?? "")) return route.fallback()
                    try {
                        const response = await route.fetch(
                            ORIGIN_AS ? { headers: { ...route.request().headers(), origin: ORIGIN_AS } } : undefined,
                        )
                        return route.fulfill({ response, json: s.reshape.map(await response.json()) })
                    } catch {
                        // the page closed while the read was in flight
                    }
                })
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
                await p.mouse.move(2, 2)
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
    fs.writeFileSync(path.join(os.tmpdir(), "gallery-capture-report.txt"), report.join("\n") + "\n")
    console.log(report.join("\n"))
    await b.close()
})().catch((e) => {
    console.error(e)
    process.exit(1)
})
