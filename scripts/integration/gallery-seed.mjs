// gallery-seed.mjs - DEV ONLY: puts the dev stack into the states the screenshot gallery cannot reach with one fresh learner, with REAL data.
// Every learner below is a named gallery learner (`gallery-<state>@example.test`) created and driven through the core's own doors:
//   - sign-up (the emailed confirmation link, read from the mail sink) and sign-in through the app's own auth doors (`/auth/*`, bearer access token);
//   - the device relay through its own doors (`/api/relay/devices/*`, `confirmRelayDevice`, the device socket `/device`, the `relayCheck*` uploads);
//   - Premium and the sample experience items through the cli app's dev-only doors (`entitlement dev-grant`, `career seed`), which the
//     cli refuses unless this script sets ENTITLEMENT_DEV_GRANT / CAREER_DEV_SEED for its own child process;
//   - the teacher / reviewer role by writing `auth.users.raw_user_meta_data.roles` in the loopback dev database (no door grants a role), then a fresh sign-in.
// Re-running leaves the same states (learners are reused, runs are replaced by newer runs of the same state).
//
// usage (repo root):  node scripts/integration/gallery-seed.mjs [--hold] [--only <learner-key>,...] [--out <dir>]
//   --hold   keeps the device sockets of the "online" learners open (a device is online only while its socket is) until Ctrl+C; run the
//            gallery capture while it holds. Without it the seed ends and those devices read offline again.
//   --out    where the Playwright storage states and manifest.json go (default `.tmp-gallery-states`, gitignored).
// Refuses anything but the loopback dev core, the loopback mail sink, the dev custody and a loopback database.
import { spawnSync } from "node:child_process"
import { randomBytes, randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import pg from "pg"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])
const fail = (message) => {
    console.error(`gallery-seed: ${message}`)
    process.exit(1)
}
const log = (message) => console.log(`gallery-seed: ${message}`)

const args = process.argv.slice(2)
const known = new Set(["--hold", "--grade-elsewhere", "--only", "--out", "--core", "--entry", "--mail", "--auth"])
for (const [i, a] of args.entries()) {
    if (a.startsWith("--") && !known.has(a)) fail(`unknown option ${a}`)
    if (
        !a.startsWith("--") &&
        !["--only", "--out", "--core", "--entry", "--mail", "--auth"].includes(args[i - 1] ?? "")
    )
        fail(`unexpected argument ${a}`)
}
const option = (name) => {
    const at = args.indexOf(name)
    return at === -1 ? undefined : args[at + 1]
}
if (process.env.NODE_ENV === "production") fail("refusing to run with NODE_ENV=production")
const loopback = (value, what) => {
    const url = new URL(value)
    if (!LOOPBACK.has(url.hostname)) fail(`refusing ${url.origin}: ${what} must be on loopback`)
    return url
}
const CORE = loopback(option("--core") ?? "http://localhost:3201", "the core api")
const ENTRY = loopback(option("--entry") ?? "http://localhost:3280", "the dev entry origin")
const MAIL = loopback(option("--mail") ?? "http://localhost:3292", "the mail sink")
/** The auth doors of the core (`/auth/*`); `--auth` names another prefix when the app mounts them elsewhere. */
const AUTH = new URL(`${(option("--auth") ?? `${CORE.origin}/auth`).replace(/\/$/, "")}/`)
loopback(AUTH.href, "the auth doors")
const OUT = resolve(option("--out") ?? ".tmp-gallery-states")
const HOLD = args.includes("--hold")
const ONLY = option("--only")?.split(",")
mkdirSync(OUT, { recursive: true })

/**
 * The password of each gallery learner (dev only, `example.test` addresses): random, made on the first run and kept in the gitignored states
 * folder beside the storage states, read back on every re-run. No password is ever in the source.
 */
const PASSWORD_FILE = join(OUT, "passwords.json")
const passwordOf = (key) => {
    let known = {}
    try {
        known = JSON.parse(readFileSync(PASSWORD_FILE, "utf8"))
    } catch {
        known = {}
    }
    if (known[key] === undefined) {
        known[key] = `${randomBytes(18).toString("base64url")}!1aA`
        writeFileSync(PASSWORD_FILE, JSON.stringify(known, null, 2))
    }
    return known[key]
}
const emailOf = (key) => `gallery-${key}@example.test`

// ---------------------------------------------------------------------------------------------------------------- custody and database

/** Runs `starci app secret get --env dev` (never any other env); the value is never printed, only the host-local file path. */
const devSecretFile = (slug, key) => {
    const run = spawnSync(`npx starci app secret get --env dev ${slug} ${key} --to-file`, {
        encoding: "utf8",
        shell: true,
    })
    const match = /^[A-Z0-9_]+_FILE=([^\r\n]+)/m.exec(`${run.stdout ?? ""}\n${run.stderr ?? ""}`)
    if (run.status !== 0 || !match) fail(`could not open the dev custody for ${slug}/${key} (exit ${run.status})`)
    return match[1].trim()
}
let dbUrlPath
/** The dev custody file of the database url (member db, key PRIMARY_DB_URL), opened on first use. */
const dbUrlFile = () => (dbUrlPath ??= devSecretFile("db", "PRIMARY_DB_URL"))
/** Refuses a database that is not on loopback (the dev stack's database never is anything else). */
const requireLoopbackDatabase = () => {
    if (!LOOPBACK.has(new URL(readFileSync(dbUrlFile(), "utf8").trim()).hostname))
        fail("refusing: the dev database is not on loopback")
}

// ---------------------------------------------------------------------------------------------------------------- http helpers

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/** One request to a loopback origin; keeps the cookies of `jar` (a Map) and names the entry origin so the doors accept it. */
const call = async (jar, base, path, { method = "GET", body, headers = {} } = {}) => {
    const cookie = jar === undefined ? undefined : [...jar].map(([name, value]) => `${name}=${value}`).join("; ")
    const answer = await fetch(new URL(path, base), {
        method,
        headers: {
            ...(body === undefined ? {} : { "content-type": "application/json" }),
            accept: "application/json",
            origin: ENTRY.origin,
            ...(cookie ? { cookie } : {}),
            ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    for (const line of answer.headers.getSetCookie?.() ?? []) {
        const [pair] = line.split(";")
        const at = pair.indexOf("=")
        if (jar !== undefined && at > 0) {
            if (/max-age=0/i.test(line)) jar.delete(pair.slice(0, at))
            else jar.set(pair.slice(0, at), pair.slice(at + 1))
        }
    }
    const text = await answer.text()
    let json
    try {
        json = JSON.parse(text)
    } catch {
        json = undefined
    }
    return { status: answer.status, json, text }
}

/** A GraphQL operation as a signed-in learner or a device ({ token }: the access token of the auth door, or the device token); throws on any error answer. */
const gql = async (auth, query, variables = {}) => {
    const operationName = /(?:query|mutation)\s+(\w+)/.exec(query)?.[1]
    const body = { query, variables, ...(operationName === undefined ? {} : { operationName }) }
    const answer = await call(undefined, CORE, "/graphql", {
        method: "POST",
        body,
        headers: { authorization: `Bearer ${auth.token}` },
    })
    if (answer.json?.errors?.length) {
        const first = answer.json.errors[0]
        const error = new Error(`${first.extensions?.code ?? "GRAPHQL"}: ${first.message}`)
        error.code = first.extensions?.code
        throw error
    }
    if (answer.status !== 200 || !answer.json?.data)
        throw new Error(`graphql answered ${answer.status}: ${answer.text.slice(0, 200)}`)
    return answer.json.data
}

/** The link token of the newest mail to an address after `since` whose link is `/auth/<kind>?token=` (kind: confirm or reset); undefined after `seconds`. */
const mailedToken = async (to, since, kind, seconds = 10) => {
    for (let attempt = 0; attempt < seconds * 2; attempt++) {
        const list = await (await fetch(new URL(`/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`, MAIL))).json()
        for (const message of list.messages ?? []) {
            if (new Date(message.Created).getTime() < since) continue
            const full = await (await fetch(new URL(`/api/v1/message/${message.ID}`, MAIL))).json()
            const token = new RegExp(`/auth/${kind}\\?token=([A-Za-z0-9_-]+)`).exec(
                `${full.HTML ?? ""} ${full.Text ?? ""}`,
            )?.[1]
            if (token) return token
        }
        await sleep(500)
    }
    return undefined
}

// ---------------------------------------------------------------------------------------------------------------- learners

/** Signs in with email and password; answers the access grant and the refresh cookie jar, or undefined when the pair is refused. */
const login = async (email, password) => {
    const jar = new Map()
    const done = await call(jar, AUTH, "login", { method: "POST", body: { email, password } })
    return done.status === 200 && typeof done.json?.accessToken === "string" ? { jar, grant: done.json } : undefined
}

/**
 * Signs the learner in through the app's own doors: password login; a learner who does not exist yet signs up, confirms the mailed link and
 * logs in; an account that exists under another password (a run before passwords were kept) takes the stored one through forgot and the
 * mailed reset link. Answers the bearer token and the refresh cookie jar (the access token lives `expiresIn` seconds: re-run for a longer seed).
 */
const signIn = async (key) => {
    const email = emailOf(key)
    const password = passwordOf(key)
    let session = await login(email, password)
    if (session === undefined) {
        const since = Date.now() - 1000
        const up = await call(undefined, AUTH, "signup", { method: "POST", body: { email, password, language: "vi" } })
        if (up.status !== 204) throw new Error(`${email}: sign-up refused (${up.status} ${up.text.slice(0, 160)})`)
        const confirm = await mailedToken(email, since, "confirm")
        if (confirm !== undefined) {
            const spent = await call(undefined, AUTH, "confirm", { method: "POST", body: { token: confirm } })
            if (spent.status !== 204) throw new Error(`${email}: the confirm link was refused (${spent.status})`)
        } else {
            const forgot = await call(undefined, AUTH, "forgot", { method: "POST", body: { email } })
            if (forgot.status !== 204) throw new Error(`${email}: forgot refused (${forgot.status})`)
            const reset = await mailedToken(email, since, "reset")
            if (reset === undefined) throw new Error(`${email}: no confirm or reset mail reached the sink`)
            const set = await call(undefined, AUTH, "reset", { method: "POST", body: { token: reset, password } })
            if (set.status !== 204)
                throw new Error(`${email}: the reset link was refused (${set.status} ${set.text.slice(0, 160)})`)
        }
        session = await login(email, password)
    }
    if (session === undefined) throw new Error(`${email}: sign-in refused after sign-up`)
    return {
        key,
        email,
        jar: session.jar,
        token: session.grant.accessToken,
        subject: session.grant.user.id,
        session: session.grant,
    }
}

/** The Playwright storage state of a signed-in learner (the refresh cookie of the auth door; cookies ignore the port, so it serves the web origin on localhost too). */
const storageStateOf = (learner) => ({
    cookies: [...learner.jar].map(([name, value]) => ({
        name,
        value,
        domain: CORE.hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
    })),
    origins: [],
})

// ---------------------------------------------------------------------------------------------------------------- the dev-only doors of the cli app

const CLI_MAIN = resolve("be", "dist", "apps", "cli", "src", "main.js")
/** Runs one verb of the compiled cli app against the dev database with the dev-only switches this script sets for that child alone. */
const cli = (verbArgs) => {
    const run = spawnSync("node", [CLI_MAIN, ...verbArgs], {
        encoding: "utf8",
        cwd: resolve("be"),
        env: {
            ...process.env,
            NODE_ENV: "development",
            PRIMARY_DB_URL_FILE: dbUrlFile(),
            ENTITLEMENT_DEV_GRANT: "true",
            CAREER_DEV_SEED: "true",
        },
    })
    if (run.status !== 0)
        fail(
            `cli ${verbArgs.slice(0, 2).join(" ")} failed (exit ${run.status}): ${`${run.stderr}${run.stdout}`.slice(-500)}`,
        )
    return run.stdout
}

// ---------------------------------------------------------------------------------------------------------------- roles (dev database)

/** Gives a learner an account role (teacher or reviewer): roles live in auth.users.raw_user_meta_data.roles and identity reads them on every request. Loopback database only. */
const grantRole = async (subject, roleName) => {
    const url = readFileSync(dbUrlFile(), "utf8").trim()
    if (!LOOPBACK.has(new URL(url).hostname)) fail("refusing: the dev database is not on loopback")
    const client = new pg.Client({ connectionString: url })
    await client.connect()
    try {
        const done = await client.query(
            "update auth.users set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('roles', (select coalesce(jsonb_agg(distinct r), '[]'::jsonb) from jsonb_array_elements_text(coalesce(raw_user_meta_data->'roles', '[]'::jsonb) || to_jsonb($2::text)) as r)) where id = $1::uuid",
            [subject, roleName.toLowerCase()],
        )
        if (done.rowCount !== 1) fail(`no account ${subject} to give the role ${roleName}`)
    } finally {
        await client.end()
    }
}

// ---------------------------------------------------------------------------------------------------------------- the device relay

const LESSON = "outbox-idempotency"
const TOPIC = "api-reliability"
const LESSON_ROUTE = `/essentials/${TOPIC}/${LESSON}`
const TASK = `lesson:${LESSON}`
/** The sockets of the online devices, kept open by --hold. */
const sockets = []

/** Revokes every device of the learner (its tokens stop at once), so a re-run pairs one fresh device and nothing piles up. */
const revokeDevices = async (learner) => {
    const { relayDevices } = await gql({ token: learner.token }, `query RelayDevices { relayDevices { id } }`)
    for (const device of relayDevices)
        await gql(
            { token: learner.token },
            `mutation RevokeRelayDevice($input: RevokeRelayDeviceInput!) { revokeRelayDevice(input: $input) { id } }`,
            {
                input: { id: device.id },
            },
        )
}

/** Pairs a machine the way the learner CLI does (start, confirm on the web as the learner, take the token) and, when asked, opens its socket. */
const pairDevice = async (learner, { name, platform, online }) => {
    await revokeDevices(learner)
    const started = await call(undefined, CORE, "/api/relay/devices/start", {
        method: "POST",
        body: { deviceName: name, platform },
    })
    if (started.status !== 200)
        throw new Error(`${learner.email}: pairing start refused (${started.status} ${started.text.slice(0, 160)})`)
    await gql(
        { token: learner.token },
        `mutation ConfirmRelayDevice($input: RelayUserCodeInput!) { confirmRelayDevice(input: $input) { id name platform } }`,
        {
            input: { userCode: started.json.userCode },
        },
    )
    const taken = await call(undefined, CORE, "/api/relay/devices/token", {
        method: "POST",
        body: { deviceCode: started.json.deviceCode },
    })
    if (taken.status !== 200)
        throw new Error(`${learner.email}: the device token was refused (${taken.status} ${taken.text.slice(0, 160)})`)
    const device = { token: taken.json.deviceToken }
    if (online) {
        const { io } = await import("socket.io-client")
        const socket = io(`${CORE.origin}/device`, {
            transports: ["websocket"],
            reconnection: true,
            auth: { deviceToken: device.token },
        })
        await new Promise((done, reject) => {
            socket.once("connect", done)
            socket.once("connect_error", reject)
        })
        // The relay marks the device online when it has opened the stream, right after the handshake: wait until the learner sees it.
        for (let attempt = 0; attempt < 20; attempt++) {
            const { relayDevices } = await gql(
                { token: learner.token },
                `query RelayDevices { relayDevices { id online } }`,
            )
            if (relayDevices.some((each) => each.online)) break
            await sleep(250)
        }
        sockets.push(socket)
    }
    return device
}

/** Uploads one scenario run the way `starci-next run` does: started, the output, then the result. `result` null leaves the run in flight. */
const uploadRun = async (device, { checkId, result, output, runId = randomUUID(), tier }) => {
    const base = { taskId: TASK, runId, checkId }
    const send = (mutation, type, input) =>
        gql(
            { token: device.token },
            `mutation ${mutation}($input: ${type}!) { ${mutation}(input: $input) { eventId accepted } }`,
            {
                input: { eventId: randomUUID(), ...base, ...input },
            },
        )
    await send("relayCheckStarted", "RelayCheckStartedInput", {})
    await sleep(120)
    if (output !== undefined) await send("relayLog", "RelayLogInput", { text: output })
    if (result === null) return
    await sleep(120)
    await send("relayCheckResult", "RelayCheckResultInput", {
        passed: result.passed,
        exitCode: result.passed ? 0 : 1,
        durationMs: result.durationMs ?? 4200,
        commit: result.commit,
        ...(result.scenario === false
            ? {}
            : {
                  slot: "scenario",
                  ref: `scenario:${checkId}`,
                  lessonId: LESSON,
                  scenarioId: checkId,
                  concepts: [],
                  guardsOff: [],
              }),
        ...(tier === undefined ? {} : { challengeTier: tier }),
        ...(result.why === undefined ? {} : { why: result.why }),
        ...(result.ledger === undefined || tier !== undefined ? {} : { ledger: result.ledger }),
    })
    await sleep(120)
}

const green = (commit) => ({
    passed: true,
    commit,
    ledger: "orders paid 1\noutbox sent 1\npartner credits 1\nverdict OK",
})
const red = (commit) => ({
    passed: false,
    commit,
    why: "[invariant:no-lost-event] Đối tác không nhận được order.paid: api chết ngay sau COMMIT và outbox không có dòng nào để gửi lại.",
    ledger: "orders paid 1\noutbox rows 0\npartner credits 0\nverdict FAIL no-lost-event",
})

/** The live version of the lesson, which the CLI relays as the commit a run ran on. */
const liveCommit = async (learner) => {
    const { lesson } = await gql(
        { token: learner.token },
        `query Lesson($input: LessonInput!) { lesson(input: $input) { version } }`,
        {
            input: { id: LESSON, locale: "vi" },
        },
    )
    return /^[0-9a-f]{7,40}$/u.test(lesson.version) ? lesson.version : "0000000"
}

/** The newest runs each essentials learner leaves: happy-path green and the second scenario, by state. */
const upCrash = async (device, commit, outcomes) => {
    await uploadRun(device, { checkId: "happy-path", result: green(commit), output: "happy-path passed (exit 0)" })
    for (const outcome of outcomes)
        await uploadRun(device, {
            checkId: "crash-after-commit",
            result: outcome === "red" ? red(commit) : green(commit),
            output: outcome === "red" ? "crash-after-commit FAILED (exit 1)" : "crash-after-commit passed (exit 0)",
        })
}

/** The essentials learners: a Premium learner with a paired, online device and the newest runs of one state. */
const ESSENTIALS = [
    {
        key: "scenarios-none",
        screens: {
            "essentials/lesson-scenarios-not-run": `${LESSON_ROUTE}?part=scenarios`,
            "essentials/lesson-source": `${LESSON_ROUTE}?part=source`,
        },
        runs: async () => {},
    },
    {
        key: "scenarios-running",
        screens: { "essentials/lesson-scenarios-running": `${LESSON_ROUTE}?part=scenarios` },
        runs: (device) =>
            uploadRun(device, {
                checkId: "happy-path",
                result: null,
                output: "Running happy-path: Một lần thanh toán, một lần báo đối tác...",
            }),
    },
    {
        key: "scenarios-red",
        screens: { "essentials/lesson-scenarios": `${LESSON_ROUTE}?part=scenarios` },
        runs: (device, commit) => upCrash(device, commit, ["red"]),
    },
    {
        key: "scenarios-stuck",
        screens: { "essentials/lesson-scenarios-stuck": `${LESSON_ROUTE}?part=scenarios` },
        runs: async (device, commit, learner) => {
            await upCrash(device, commit, ["red", "red"])
            const hinted = (
                await gql(
                    { token: learner.token },
                    `query Lesson($input: LessonInput!) { lesson(input: $input) { essential { scenarios { id hint } } } }`,
                    { input: { id: LESSON, locale: "vi" } },
                )
            ).lesson.essential.scenarios.find((each) => each.id === "crash-after-commit")?.hint
            if (hinted)
                await gql(
                    { token: learner.token },
                    `mutation RevealLessonHint($input: RevealLessonHintInput!) { revealLessonHint(input: $input) { scenarioId hint } }`,
                    {
                        input: { lessonId: LESSON, scenarioId: "crash-after-commit", locale: "vi" },
                    },
                ).catch((error) => log(`${learner.email}: the hint was not opened (${error.message})`))
        },
    },
    {
        key: "scenarios-green",
        screens: { "essentials/lesson-scenarios-green": `${LESSON_ROUTE}?part=scenarios&scenario=crash-after-commit` },
        runs: (device, commit) => upCrash(device, commit, ["red", "green"]),
    },
    {
        key: "ladder",
        screens: { "essentials/lesson-ladder": `${LESSON_ROUTE}?part=apply` },
        runs: async (device, commit) => {
            // Rung scores as the CLI relays them (`starci-next run --challenge <tier>`). The hidden scenario ids are the ones of the lesson's own
            // hidden/challenge-scenarios.yaml (a learner's reads only carry their number): both easy ones green, one of the two medium ones.
            const easy = ["h-easy-key-reuse-409", "h-easy-replay-still-200"]
            const medium = ["h-medium-split-payment", "h-medium-paid-twice"]
            for (const id of easy)
                await uploadRun(device, {
                    checkId: id,
                    tier: "easy",
                    result: green(commit),
                    output: "1 test(s), passed",
                })
            await uploadRun(device, {
                checkId: medium[0],
                tier: "medium",
                result: green(commit),
                output: "1 test(s), passed",
            })
            log(`ladder: easy ${easy.length} green, medium 1 of ${medium.length} green`)
        },
    },
    {
        key: "source-up-failed",
        screens: { "essentials/lesson-source-up-failed": `${LESSON_ROUTE}?part=source` },
        runs: (device, commit) =>
            uploadRun(device, {
                checkId: "up",
                result: { passed: false, commit, scenario: false },
                output: "Container outbox-db  Error\nport 5432 is already allocated\nstarci-next up failed (exit 1).",
            }),
    },
]

// ---------------------------------------------------------------------------------------------------------------- main

/** A run with --only keeps what earlier runs wrote: the manifest is merged, never replaced. */
const previous = (() => {
    try {
        return JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8"))
    } catch {
        return { learners: {}, screens: {} }
    }
})()
const manifest = {
    generatedAt: new Date().toISOString(),
    learners: { ...previous.learners },
    screens: { ...previous.screens },
}
const want = (key) => ONLY === undefined || ONLY.includes(key)
const remember = (learner, screens, extra = {}) => {
    writeFileSync(join(OUT, `${learner.key}.json`), JSON.stringify(storageStateOf(learner)))
    manifest.learners[learner.key] = {
        email: learner.email,
        subject: learner.subject,
        state: `${learner.key}.json`,
        ...extra,
    }
    for (const [screen, route] of Object.entries(screens)) manifest.screens[screen] = { learner: learner.key, route }
}

// ---------------------------------------------------------------------------------------------------------------- review

const REVIEW_DECKS = [
    "0-fullstack-mastery/0-nestjs-core-and-lifecycle",
    "1-system-design-mastery/0-core-concepts-and-tradeoffs",
    "0-fullstack-mastery/1-api-design-and-graphql",
]
const TODAY = `query ReviewToday($input: RecallTodayInput!) { reviewToday(input: $input) { due newAvailable goal { daily done } items { itemId status } } }`
const reviewToday = async (learner) =>
    (await gql({ token: learner.token }, TODAY, { input: { locale: "vi" } })).reviewToday
const addDeck = (learner, deckId) =>
    gql(
        { token: learner.token },
        `mutation AddReviewDeck($input: RecallDeckInput!) { addReviewDeck(input: $input) { deckId added newCards } }`,
        { input: { deckId } },
    )
const setGoal = (learner, daily) =>
    gql(
        { token: learner.token },
        `mutation SetReviewGoal($input: SetRecallGoalInput!) { setReviewGoal(input: $input) { daily } }`,
        { input: { daily } },
    )
/** Flips a card and stores a self-grade for it, as the review session does (flip answers the revision to grade). */
const flipAndGrade = async (learner, itemId, grade) => {
    const { flipReviewCard } = await gql(
        { token: learner.token },
        `mutation FlipReviewCard($input: FlipRecallCardInput!) { flipReviewCard(input: $input) { itemId revision } }`,
        { input: { itemId, locale: "vi" } },
    )
    await gql(
        { token: learner.token },
        `mutation GradeReviewCard($input: GradeRecallCardInput!) { gradeReviewCard(input: $input) { itemId remainingToday } }`,
        { input: { itemId, revision: flipReviewCard.revision, grade: grade.toUpperCase() } },
    )
}

// `--grade-elsewhere`: the second device of review/session-conflict. The browser has flipped the first card of the session; this signs the
// same learner in again (a second session), flips and grades that same card "good", so the browser's own grade ("again") is a revision conflict.
if (args.includes("--grade-elsewhere")) {
    const learner = await signIn("review-conflict")
    const today = await reviewToday(learner)
    const first = today.items[0]
    if (first === undefined)
        fail("review-conflict has no card due (every card was consumed; add decks or use a new learner)")
    await flipAndGrade(learner, first.itemId, "good")
    log(`graded ${first.itemId} "good" from a second session`)
    process.exit(0)
}

requireLoopbackDatabase()

for (const spec of ESSENTIALS.filter((each) => want(each.key))) {
    const learner = await signIn(spec.key)
    cli(["entitlement", "dev-grant", "--learner", learner.subject])
    const commit = await liveCommit(learner)
    const device = await pairDevice(learner, { name: `May Gallery ${spec.key}`, platform: "windows", online: true })
    await spec.runs(device, commit, learner)
    remember(learner, spec.screens, { device: "online while --hold runs" })
    log(`${learner.email}: ${Object.keys(spec.screens).join(", ")}`)
}

// review/hub-nothing: decks added, every card of them graded today, a goal above what was done: nothing is due and the goal is not reached.
if (want("review-nothing")) {
    const learner = await signIn("review-nothing")
    await addDeck(learner, REVIEW_DECKS[0])
    await setGoal(learner, 20)
    for (let today = await reviewToday(learner); today.items.length > 0; today = await reviewToday(learner))
        await flipAndGrade(learner, today.items[0].itemId, "good")
    remember(learner, { "review/hub-nothing": "/review" })
    log(`${learner.email}: review/hub-nothing`)
}

// review/session-conflict: cards due today; the capture flips the first card, runs `--grade-elsewhere`, then grades "again" in the browser.
if (want("review-conflict")) {
    const learner = await signIn("review-conflict")
    for (const deck of REVIEW_DECKS) await addDeck(learner, deck)
    await setGoal(learner, 50)
    remember(
        learner,
        { "review/session-conflict": "/review/session" },
        {
            act: "flip the first card (Hien dap an), run `node scripts/integration/gallery-seed.mjs --grade-elsewhere`, then grade Lai in the browser",
        },
    )
    log(`${learner.email}: review/session-conflict (${(await reviewToday(learner)).items.length} cards due)`)
}

// ---------------------------------------------------------------------------------------------------------------- career

const grantAndSignIn = async (key, role) => {
    const first = await signIn(key)
    await grantRole(first.subject, role)
    // The roles of a session are the ones of the sign-in that made it: sign in again after the grant.
    return signIn(key)
}
const MY_EXPERIENCE = `query MyExperience($input: MyExperienceInput!) { myExperience(input: $input) { items { itemId state part itemType subject verificationCode } } }`
const myItems = async (learner) =>
    (await gql({ token: learner.token }, MY_EXPERIENCE, { input: {} })).myExperience.items

if (want("career-teacher") || want("career-states") || want("career-revoked") || want("career-reviewer")) {
    const teacher = await grantAndSignIn("career-teacher", "TEACHER")
    const reviewer = await grantAndSignIn("career-reviewer", "REVIEWER")
    // The sample items of the career cli: one ai-graded (a draft), one waiting in the teacher's queue, one verified (signed by the dev signer).
    const states = await signIn("career-states")
    cli(["career", "seed", "--learner", states.subject])
    cli(["entitlement", "dev-grant", "--learner", states.subject])
    // A second learner whose verified item the teacher then revokes: an item in each of draft, waiting and revoked.
    const revoked = await signIn("career-revoked")
    cli(["career", "seed", "--learner", revoked.subject])
    const verifiedOfRevoked = (await myItems(revoked)).find((item) => item.state === "verified")
    if (verifiedOfRevoked !== undefined)
        await gql(
            { token: teacher.token },
            `mutation RevokeExperience($input: RevokeExperienceInput!) { revokeExperience(input: $input) { itemId state } }`,
            {
                input: { itemId: verifiedOfRevoked.itemId, reason: "Bằng chứng không còn đúng với bản hiện tại." },
            },
        ).catch((error) => log(`the revoke was refused (${error.message})`))
    // The teacher appoints the reviewer (the "Người duyệt" tab).
    await gql(
        { token: teacher.token },
        `mutation SetExperienceReviewer($input: SetExperienceReviewerInput!) { setExperienceReviewer(input: $input) { reviewerId } }`,
        {
            input: {
                reviewerId: reviewer.subject,
                parts: ["projects", "harness"],
                capacity: 5,
                conflicts: [],
                end: false,
            },
        },
    )
    // The public CV with a slug: the learner whose one verified line shows publicly.
    const verified = (await myItems(states)).find((item) => item.state === "verified")
    if (verified !== undefined)
        await gql(
            { token: states.token },
            `mutation ShowExperience($input: ShowExperienceInput!) { showExperience(input: $input) { itemId } }`,
            {
                input: { itemId: verified.itemId, shownPublicly: true },
            },
        ).catch((error) => log(`show on CV refused (${error.message})`))
    const cv = await gql(
        { token: states.token },
        `mutation SetCvVisibility($input: SetCvVisibilityInput!) { setCvVisibility(input: $input) { slug path isPublic verifiedCount } }`,
        {
            input: { isPublic: true },
        },
    ).catch((error) => (log(`CV visibility refused (${error.message})`), undefined))
    const queue = await gql(
        { token: teacher.token },
        `query ReviewQueue($input: ReviewQueueInput!) { reviewQueue(input: $input) { role items { itemId state } } }`,
        { input: { tab: "pending" } },
    )
    const waiting = queue.reviewQueue.items.find((item) => item.itemId !== undefined)
    const items = await myItems(states)
    const waitingOfStates = items.find((item) => item.state === "pending-review")
    const draft = items.find((item) => item.state === "ai-graded")
    remember(
        teacher,
        {
            "career/review-queue": "/review-queue",
            "career/review-queue-reviewers": '/review-queue (then click the tab "Người duyệt")',
            ...(waitingOfStates === undefined
                ? {}
                : { "career/review-item": `/review-queue/${waitingOfStates.itemId}` }),
            ...(verified === undefined ? {} : { "career/review-item-verified": `/review-queue/${verified.itemId}` }),
        },
        { role: "TEACHER", queueHead: waiting?.itemId },
    )
    remember(
        reviewer,
        { "career/review-queue (as a reviewer)": "/review-queue" },
        { role: "REVIEWER, appointed for projects and harness" },
    )
    remember(
        states,
        { "career/experience": "/experience", "profile/cv": cv?.setCvVisibility.path ?? "/profile" },
        {
            items: items.map((item) => `${item.state}:${item.part}`),
            draft: draft?.itemId,
            cv: cv?.setCvVisibility,
        },
    )
    // career/verify-revoked: the public verification page of the revoked item's code (a guest opens it).
    const revokedItem = (await myItems(revoked)).find((item) => item.state === "revoked")
    if (revokedItem !== undefined) {
        manifest.screens["career/verify-revoked"] = {
            learner: "career-revoked",
            route: `/verify/${revokedItem.verificationCode}`,
            guest: true,
        }
    }
    remember(
        revoked,
        { "career/experience (draft, waiting, revoked)": "/experience" },
        { items: (await myItems(revoked)).map((item) => `${item.state}:${item.part}`) },
    )
    log(
        `career: teacher, reviewer, states (${items.length} items), revoked; cv ${cv?.setCvVisibility.path ?? "not set"}`,
    )
}

// cv/public with several signed lines from different parts and signers: the verified deployed line (signed by the dev signer, TEACHER role), the
// milestone line signed by the appointed REVIEWER and the essentials line the teacher signs after the learner sent it: all shown on the public CV.
if (want("cv-multi")) {
    const teacher = await grantAndSignIn("career-teacher", "TEACHER")
    const reviewer = await grantAndSignIn("career-reviewer", "REVIEWER")
    await gql(
        { token: teacher.token },
        `mutation SetExperienceReviewer($input: SetExperienceReviewerInput!) { setExperienceReviewer(input: $input) { reviewerId } }`,
        {
            input: {
                reviewerId: reviewer.subject,
                parts: ["projects", "harness"],
                capacity: 5,
                conflicts: [],
                end: false,
            },
        },
    )
    const learner = await signIn("cv-multi")
    cli(["career", "seed", "--learner", learner.subject])
    cli(["entitlement", "dev-grant", "--learner", learner.subject])
    const ITEMS = `query MyExperience($input: MyExperienceInput!) { myExperience(input: $input) { items { itemId state part draftLine { vi en } } } }`
    const read = async () => (await gql({ token: learner.token }, ITEMS, { input: {} })).myExperience.items
    const decide = (who, itemId) =>
        gql(
            { token: who.token },
            `mutation DecideExperience($input: DecideExperienceInput!) { decideExperience(input: $input) { itemId state refusal } }`,
            { input: { decisions: [{ itemId, verdict: "approve" }] } },
        ).catch((error) => log(`cv-multi: decision refused (${error.message})`))
    // The learner sends the graded essentials line; the teacher signs it.
    const graded = (await read()).find((item) => item.state === "ai-graded")
    if (graded?.draftLine)
        await gql(
            { token: learner.token },
            `mutation SubmitExperience($input: SubmitExperienceInput!) { submitExperience(input: $input) { itemId state } }`,
            { input: { itemId: graded.itemId, line: { vi: graded.draftLine.vi, en: graded.draftLine.en } } },
        ).catch((error) => log(`cv-multi: submit refused (${error.message})`))
    for (const item of (await read()).filter((each) => each.state === "pending-review")) {
        if (item.part === "projects") {
            // Assigned to the appointed reviewer, who signs it as REVIEWER.
            await gql(
                { token: teacher.token },
                `mutation AssignExperience($input: AssignExperienceInput!) { assignExperience(input: $input) { itemId } }`,
                { input: { itemId: item.itemId, reviewerId: reviewer.subject } },
            ).catch((error) => log(`cv-multi: assign refused (${error.message})`))
            await decide(reviewer, item.itemId)
        } else await decide(teacher, item.itemId)
    }
    const signed = (await read()).filter((item) => item.state === "verified")
    for (const item of signed)
        await gql(
            { token: learner.token },
            `mutation ShowExperience($input: ShowExperienceInput!) { showExperience(input: $input) { itemId } }`,
            { input: { itemId: item.itemId, shownPublicly: true } },
        ).catch((error) => log(`cv-multi: show refused (${error.message})`))
    const cv = await gql(
        { token: learner.token },
        `mutation SetCvVisibility($input: SetCvVisibilityInput!) { setCvVisibility(input: $input) { slug path isPublic verifiedCount } }`,
        { input: { isPublic: true } },
    ).catch((error) => (log(`cv-multi: CV visibility refused (${error.message})`), undefined))
    remember(
        learner,
        { "cv/public": cv?.setCvVisibility.path ?? "/profile" },
        { verified: signed.map((item) => item.part), cv: cv?.setCvVisibility },
    )
    manifest.screens["cv/public"] = { learner: "cv-multi", route: cv?.setCvVisibility.path ?? "/profile", guest: true }
    log(
        `cv-multi: ${signed.length} verified lines (${signed.map((item) => item.part).join(", ")}); cv ${cv?.setCvVisibility.path ?? "not set"}`,
    )
}

// ---------------------------------------------------------------------------------------------------------------- commerce

/** The purchase rows of a learner, read only (the dev database, as simulate-sepay-ipn.mjs reads them): the checkout door answers no id when the provider refuses. */
const purchasesOf = async (learner) => {
    const db = new pg.Client({ connectionString: readFileSync(dbUrlFile(), "utf8").trim() })
    await db.connect()
    try {
        const { rows } = await db.query(
            "select purchase_id, order_code, status, rail, amount_vnd from purchases where learner_id = $1 order by created_at desc",
            [learner.subject],
        )
        return rows
    } finally {
        await db.end()
    }
}
const CHECKOUT = `mutation StartPremiumCheckout($input: StartPremiumCheckoutInput!) { startPremiumCheckout(input: $input) { orderId rail } }`

// premium/result of a failed order: the payOS rail refuses the dev sandbox placeholder merchant, so the app itself closes the purchase as failed.
if (want("orders-failed")) {
    const learner = await signIn("orders-failed")
    if (!(await purchasesOf(learner)).some((row) => row.status === "failed"))
        await gql({ token: learner.token }, CHECKOUT, { input: { plan: "monthly", rail: "payos" } }).catch((error) => {
            if (error.code !== "PURCHASE_CHECKOUT_REFUSED") throw error
        })
    const failed = (await purchasesOf(learner)).find((row) => row.status === "failed")
    if (failed === undefined) fail("orders-failed: no failed purchase")
    remember(learner, { "commerce/premium-result-failed": `/premium/result?order=${failed.purchase_id}` })
    log(`${learner.email}: failed order ${failed.order_code}`)
}

// premium/result of an active order: checkout on the sepay rail, then the paid IPN the gateway would post (the dev secrets are placeholders, so
// the same simulation as simulate-sepay-ipn.mjs: the webhook door authenticates the x-secret-key header).
if (want("orders-active")) {
    const learner = await signIn("orders-active")
    let paid = (await purchasesOf(learner)).find((row) => row.status === "paid")
    if (paid === undefined) {
        const started = await gql({ token: learner.token }, CHECKOUT, { input: { plan: "monthly", rail: "sepay" } })
        const order = (await purchasesOf(learner)).find(
            (row) => row.purchase_id === started.startPremiumCheckout.orderId,
        )
        const answer = await call(undefined, CORE, "/webhooks/sepay", {
            method: "POST",
            headers: { "x-secret-key": readFileSync(devSecretFile("sepay", "SEPAY_IPN_SECRET_KEY"), "utf8").trim() },
            body: {
                timestamp: Math.floor(Date.now() / 1000),
                notification_type: "ORDER_PAID",
                order: {
                    order_invoice_number: order.order_code,
                    order_amount: String(order.amount_vnd),
                    order_status: "CAPTURED",
                    order_currency: "VND",
                },
                transaction: {
                    transaction_id: `dev-sim-${randomUUID()}`,
                    transaction_type: "PAYMENT",
                    payment_method: "BANK_TRANSFER",
                    transaction_status: "APPROVED",
                    transaction_amount: String(order.amount_vnd),
                    transaction_currency: "VND",
                },
            },
        })
        if (answer.status !== 200 && answer.status !== 204)
            fail(`orders-active: the webhook door refused the IPN (${answer.status})`)
        for (let attempt = 0; attempt < 20 && paid === undefined; attempt++) {
            paid = (await purchasesOf(learner)).find((row) => row.status === "paid")
            if (paid === undefined) await sleep(500)
        }
    }
    if (paid === undefined) fail("orders-active: the order did not settle")
    remember(learner, { "commerce/premium-result-unlocked": `/premium/result?order=${paid.purchase_id}` })
    log(`${learner.email}: active order ${paid.order_code}`)
}

// devices/list-limit-reached: a free learner (no Premium) with exactly one paired device, the free plan's limit.
if (want("devices-free-limit")) {
    const learner = await signIn("devices-free-limit")
    await pairDevice(learner, { name: "May Gallery duy nhat", platform: "windows", online: false })
    remember(learner, { "devices/list-limit-reached": "/devices" })
    log(`${learner.email}: one device on the free plan`)
}

// ---------------------------------------------------------------------------------------------------------------- projects

if (want("projects-owner")) {
    const learner = await signIn("projects-owner")
    cli(["entitlement", "dev-grant", "--learner", learner.subject])
    const existing = await gql({ token: learner.token }, `query Projects { projects { items { id name } } }`).catch(
        () => undefined,
    )
    if (existing === undefined || (existing.projects.items ?? []).length === 0)
        await gql(
            { token: learner.token },
            `mutation CreateProject($input: CreateProjectInput!) { createProject(input: $input) { project { id name } } }`,
            {
                input: {
                    name: "Gallery shop",
                    kind: "app",
                    topic: "api-reliability",
                    language: "typescript",
                    stack: "NestJS, PostgreSQL",
                    locale: "vi",
                },
            },
        )
    remember(learner, { "projects/list": "/projects", "projects/detail": "/projects (first project)" })
    log(`${learner.email}: a Premium learner with one project`)
}

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2))
if (HOLD && sockets.length > 0) {
    log(`holding ${sockets.length} device socket(s) open; Ctrl+C to release them (the devices read offline again)`)
    await new Promise(() => {})
}
process.exit(0)
