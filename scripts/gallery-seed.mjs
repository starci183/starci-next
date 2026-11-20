// gallery-seed.mjs - DEV ONLY: puts the dev stack into the states the screenshot gallery cannot reach with one fresh learner, with REAL data.
// Every learner below is a named gallery learner (`gallery-<state>@example.test`) created and driven through the core's own doors:
//   - sign-up / sign-in through the identity HTTP doors and the six-digit code of the mail sink (the normal dev sign-in);
//   - the device relay through its own doors (`/api/relay/devices/*`, `confirmRelayDevice`, the device socket `/device`, the `relayCheck*` uploads);
//   - Premium and the sample experience items through the cli app's dev-only doors (`entitlement dev-grant`, `career seed`), which the
//     cli refuses unless this script sets ENTITLEMENT_DEV_GRANT / CAREER_DEV_SEED for its own child process;
//   - the teacher / reviewer role through the dev Keycloak admin API (the realm roles TEACHER and REVIEWER), then a fresh sign-in.
// Re-running leaves the same states (learners are reused, runs are replaced by newer runs of the same state).
//
// usage (repo root):  node scripts/gallery-seed.mjs [--hold] [--only <learner-key>,...] [--out <dir>]
//   --hold   keeps the device sockets of the "online" learners open (a device is online only while its socket is) until Ctrl+C; run the
//            gallery capture while it holds. Without it the seed ends and those devices read offline again.
//   --out    where the Playwright storage states and manifest.json go (default `.tmp-gallery-states`, gitignored).
// Refuses anything but the loopback dev core, the loopback mail sink, the loopback dev Keycloak, the dev custody and a loopback database.
import { spawnSync } from "node:child_process"
import { randomBytes, randomUUID } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import https from "node:https"
import pg from "pg"
import { createRequire } from "node:module"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])
const fail = (message) => {
    console.error(`gallery-seed: ${message}`)
    process.exit(1)
}
const log = (message) => console.log(`gallery-seed: ${message}`)

const args = process.argv.slice(2)
const known = new Set(["--hold", "--grade-elsewhere", "--only", "--out", "--core", "--entry", "--mail", "--keycloak"])
for (const [i, a] of args.entries()) {
    if (a.startsWith("--") && !known.has(a)) fail(`unknown option ${a}`)
    if (
        !a.startsWith("--") &&
        !["--only", "--out", "--core", "--entry", "--mail", "--keycloak"].includes(args[i - 1] ?? "")
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
const KEYCLOAK = loopback(option("--keycloak") ?? "https://localhost:8089", "the dev Keycloak")
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
let custodyFile
/** The dev custody file of a sealed key the stack materialized beside the others (opened on first use). */
const siblingFile = (name) => {
    custodyFile ??= devSecretFile("sepay", "SEPAY_IPN_SECRET_KEY")
    return custodyFile.replace(/SEPAY_IPN_SECRET_KEY$/, name)
}
/** Refuses a database that is not on loopback (the dev stack's database never is anything else). */
const requireLoopbackDatabase = () => {
    if (!LOOPBACK.has(new URL(readFileSync(siblingFile("PRIMARY_DB_URL"), "utf8").trim()).hostname))
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

/** A GraphQL operation as a signed-in learner (cookie jar) or as a device (bearer token); throws on any error answer. */
const gql = async (auth, query, variables = {}) => {
    const operationName = /(?:query|mutation)s+(w+)/.exec(query)?.[1]
    const body = { query, variables, ...(operationName === undefined ? {} : { operationName }) }
    const answer =
        auth.jar === undefined
            ? await call(undefined, CORE, "/graphql", {
                  method: "POST",
                  body,
                  headers: { authorization: `Bearer ${auth.token}` },
              })
            : await call(auth.jar, CORE, "/graphql", { method: "POST", body })
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

/** The newest six-digit code mailed to an address after `since`, waiting for it up to 15 s. */
const mailedCode = async (to, since) => {
    for (let attempt = 0; attempt < 30; attempt++) {
        const list = await (await fetch(new URL(`/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`, MAIL))).json()
        const message = (list.messages ?? []).find((each) => new Date(each.Created).getTime() >= since)
        if (message) {
            const full = await (await fetch(new URL(`/api/v1/message/${message.ID}`, MAIL))).json()
            const code = /\b(\d{6})\b/.exec(full.Text ?? "")?.[1]
            if (code) return code
        }
        await sleep(500)
    }
    throw new Error(`no code mailed to ${to}`)
}

// ---------------------------------------------------------------------------------------------------------------- learners

/**
 * Signs the learner in through the normal dev flow (password, then the emailed code) and answers the session cookies; a learner who does
 * not exist yet signs up first (the sign-up code confirms the address and issues the session).
 */
const signIn = async (key) => {
    const email = emailOf(key)
    const jar = new Map()
    const since = Date.now() - 1000
    const password = passwordOf(key)
    let step = await call(jar, ENTRY, "/api/identity/sign-in", {
        method: "POST",
        body: { identifier: email, password },
    })
    let verify = "/api/identity/sign-in/verify"
    if (step.status !== 200) {
        step = await call(jar, ENTRY, "/api/identity/sign-up", {
            method: "POST",
            body: { email, password, acceptTerms: true },
        })
        verify = "/api/identity/sign-up/verify"
        if (step.status !== 200) {
            // The account exists under another password (an earlier run before passwords were kept): set the stored one through the dev Keycloak admin API.
            await resetPassword(email, password)
            step = await call(jar, ENTRY, "/api/identity/sign-in", {
                method: "POST",
                body: { identifier: email, password },
            })
            verify = "/api/identity/sign-in/verify"
        }
    }
    if (step.status !== 200 || typeof step.json?.challenge !== "string")
        throw new Error(`${email}: sign-in and sign-up both refused (${step.status} ${step.text.slice(0, 160)})`)
    const code = await mailedCode(email, since)
    const done = await call(jar, ENTRY, verify, { method: "POST", body: { challenge: step.json.challenge, code } })
    if (done.status !== 204)
        throw new Error(`${email}: the code was refused (${done.status} ${done.text.slice(0, 160)})`)
    const session = await call(jar, ENTRY, "/api/identity/session")
    if (session.status !== 200) throw new Error(`${email}: no session after the code (${session.status})`)
    return { key, email, jar, subject: session.json.identity.subject, session: session.json }
}

/** The Playwright storage state of a signed-in learner (the host-only cookie on localhost). */
const storageStateOf = (learner) => ({
    cookies: [...learner.jar].map(([name, value]) => ({
        name,
        value,
        domain: ENTRY.hostname,
        path: "/",
        expires: -1,
        httpOnly: true,
        secure: true,
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
            PRIMARY_DB_URL_FILE: siblingFile("PRIMARY_DB_URL"),
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

// ---------------------------------------------------------------------------------------------------------------- the dev Keycloak (realm roles)

const REALM = "starci-next-identity"
/** One request to the dev Keycloak on loopback; its certificate is the self-signed one of the compose project. */
const kc = (path, { method = "GET", token, body, form } = {}) =>
    new Promise((done, reject) => {
        const payload =
            form === undefined
                ? body === undefined
                    ? undefined
                    : JSON.stringify(body)
                : new URLSearchParams(form).toString()
        const request = https.request(
            {
                host: KEYCLOAK.hostname,
                port: KEYCLOAK.port,
                path,
                method,
                rejectUnauthorized: false,
                headers: {
                    ...(payload === undefined
                        ? {}
                        : {
                              "content-type":
                                  form === undefined ? "application/json" : "application/x-www-form-urlencoded",
                          }),
                    ...(token === undefined ? {} : { authorization: `Bearer ${token}` }),
                },
            },
            (answer) => {
                let text = ""
                answer.on("data", (chunk) => (text += chunk))
                answer.on("end", () => done({ status: answer.statusCode, json: text ? JSON.parse(text) : undefined }))
            },
        )
        request.on("error", reject)
        if (payload !== undefined) request.write(payload)
        request.end()
    })

/** Sets a learner's password through the service account of the dev identity client. */
const resetPassword = async (email, password) => {
    const keycloakSecret = readFileSync(siblingFile("IDENTITY_KEYCLOAK_CLIENT_SECRET"), "utf8").trim()
    const grant = await kc(`/realms/${REALM}/protocol/openid-connect/token`, {
        method: "POST",
        form: {
            grant_type: "client_credentials",
            client_id: "starci-next-identity-lane",
            client_secret: keycloakSecret,
        },
    })
    const token = grant.json?.access_token
    if (!token) fail(`the dev Keycloak refused the service account (${grant.status})`)
    const found = await kc(`/admin/realms/${REALM}/users?email=${encodeURIComponent(email)}&exact=true`, { token })
    const user = found.json?.[0]
    if (user === undefined) fail(`${email}: neither sign-in nor sign-up worked and the dev Keycloak has no such user`)
    const put = await kc(`/admin/realms/${REALM}/users/${user.id}/reset-password`, {
        method: "PUT",
        token,
        body: { type: "password", value: password, temporary: false },
    })
    if (put.status !== 204) fail(`the password of ${email} was not set (${put.status})`)
}

/** Gives a learner a realm role (TEACHER or REVIEWER) through the service account of the dev identity client. */
const grantRole = async (subject, roleName) => {
    const keycloakSecret = readFileSync(siblingFile("IDENTITY_KEYCLOAK_CLIENT_SECRET"), "utf8").trim()
    const grant = await kc(`/realms/${REALM}/protocol/openid-connect/token`, {
        method: "POST",
        form: {
            grant_type: "client_credentials",
            client_id: "starci-next-identity-lane",
            client_secret: keycloakSecret,
        },
    })
    const token = grant.json?.access_token
    if (!token) fail(`the dev Keycloak refused the service account (${grant.status})`)
    const roles = await kc(`/admin/realms/${REALM}/roles`, { token })
    const role = { status: roles.status, json: (roles.json ?? []).find((each) => each.name === roleName) }
    if (role.json === undefined) fail(`the dev Keycloak has no realm role ${roleName} (${roles.status})`)
    const put = await kc(`/admin/realms/${REALM}/users/${subject}/role-mappings/realm`, {
        method: "POST",
        token,
        body: [{ id: role.json.id, name: role.json.name }],
    })
    if (put.status !== 204) fail(`the role ${roleName} was not granted to ${subject} (${put.status})`)
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
    const { relayDevices } = await gql({ jar: learner.jar }, `query RelayDevices { relayDevices { id } }`)
    for (const device of relayDevices)
        await gql(
            { jar: learner.jar },
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
        { jar: learner.jar },
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
                { jar: learner.jar },
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
        { jar: learner.jar },
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
                    { jar: learner.jar },
                    `query Lesson($input: LessonInput!) { lesson(input: $input) { essential { scenarios { id hint } } } }`,
                    { input: { id: LESSON, locale: "vi" } },
                )
            ).lesson.essential.scenarios.find((each) => each.id === "crash-after-commit")?.hint
            if (hinted)
                await gql(
                    { jar: learner.jar },
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
const reviewToday = async (learner) => (await gql({ jar: learner.jar }, TODAY, { input: { locale: "vi" } })).reviewToday
const addDeck = (learner, deckId) =>
    gql(
        { jar: learner.jar },
        `mutation AddReviewDeck($input: RecallDeckInput!) { addReviewDeck(input: $input) { deckId added newCards } }`,
        { input: { deckId } },
    )
const setGoal = (learner, daily) =>
    gql(
        { jar: learner.jar },
        `mutation SetReviewGoal($input: SetRecallGoalInput!) { setReviewGoal(input: $input) { daily } }`,
        { input: { daily } },
    )
/** Flips a card and stores a self-grade for it, as the review session does (flip answers the revision to grade). */
const flipAndGrade = async (learner, itemId, grade) => {
    const { flipReviewCard } = await gql(
        { jar: learner.jar },
        `mutation FlipReviewCard($input: FlipRecallCardInput!) { flipReviewCard(input: $input) { itemId revision } }`,
        { input: { itemId, locale: "vi" } },
    )
    await gql(
        { jar: learner.jar },
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
            act: "flip the first card (Hien dap an), run `node scripts/gallery-seed.mjs --grade-elsewhere`, then grade Lai in the browser",
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
const myItems = async (learner) => (await gql({ jar: learner.jar }, MY_EXPERIENCE, { input: {} })).myExperience.items

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
            { jar: teacher.jar },
            `mutation RevokeExperience($input: RevokeExperienceInput!) { revokeExperience(input: $input) { itemId state } }`,
            {
                input: { itemId: verifiedOfRevoked.itemId, reason: "Bằng chứng không còn đúng với bản hiện tại." },
            },
        ).catch((error) => log(`the revoke was refused (${error.message})`))
    // The teacher appoints the reviewer (the "Người duyệt" tab).
    await gql(
        { jar: teacher.jar },
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
            { jar: states.jar },
            `mutation ShowExperience($input: ShowExperienceInput!) { showExperience(input: $input) { itemId } }`,
            {
                input: { itemId: verified.itemId, shownPublicly: true },
            },
        ).catch((error) => log(`show on CV refused (${error.message})`))
    const cv = await gql(
        { jar: states.jar },
        `mutation SetCvVisibility($input: SetCvVisibilityInput!) { setCvVisibility(input: $input) { slug path isPublic verifiedCount } }`,
        {
            input: { isPublic: true },
        },
    ).catch((error) => (log(`CV visibility refused (${error.message})`), undefined))
    const queue = await gql(
        { jar: teacher.jar },
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
        { jar: teacher.jar },
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
    const read = async () => (await gql({ jar: learner.jar }, ITEMS, { input: {} })).myExperience.items
    const decide = (who, itemId) =>
        gql(
            { jar: who.jar },
            `mutation DecideExperience($input: DecideExperienceInput!) { decideExperience(input: $input) { itemId state refusal } }`,
            { input: { decisions: [{ itemId, verdict: "approve" }] } },
        ).catch((error) => log(`cv-multi: decision refused (${error.message})`))
    // The learner sends the graded essentials line; the teacher signs it.
    const graded = (await read()).find((item) => item.state === "ai-graded")
    if (graded?.draftLine)
        await gql(
            { jar: learner.jar },
            `mutation SubmitExperience($input: SubmitExperienceInput!) { submitExperience(input: $input) { itemId state } }`,
            { input: { itemId: graded.itemId, line: { vi: graded.draftLine.vi, en: graded.draftLine.en } } },
        ).catch((error) => log(`cv-multi: submit refused (${error.message})`))
    for (const item of (await read()).filter((each) => each.state === "pending-review")) {
        if (item.part === "projects") {
            // Assigned to the appointed reviewer, who signs it as REVIEWER.
            await gql(
                { jar: teacher.jar },
                `mutation AssignExperience($input: AssignExperienceInput!) { assignExperience(input: $input) { itemId } }`,
                { input: { itemId: item.itemId, reviewerId: reviewer.subject } },
            ).catch((error) => log(`cv-multi: assign refused (${error.message})`))
            await decide(reviewer, item.itemId)
        } else await decide(teacher, item.itemId)
    }
    const signed = (await read()).filter((item) => item.state === "verified")
    for (const item of signed)
        await gql(
            { jar: learner.jar },
            `mutation ShowExperience($input: ShowExperienceInput!) { showExperience(input: $input) { itemId } }`,
            { input: { itemId: item.itemId, shownPublicly: true } },
        ).catch((error) => log(`cv-multi: show refused (${error.message})`))
    const cv = await gql(
        { jar: learner.jar },
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
    const db = new pg.Client({ connectionString: readFileSync(siblingFile("PRIMARY_DB_URL"), "utf8").trim() })
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
        await gql({ jar: learner.jar }, CHECKOUT, { input: { plan: "monthly", rail: "payos" } }).catch((error) => {
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
        const started = await gql({ jar: learner.jar }, CHECKOUT, { input: { plan: "monthly", rail: "sepay" } })
        const order = (await purchasesOf(learner)).find(
            (row) => row.purchase_id === started.startPremiumCheckout.orderId,
        )
        const answer = await call(undefined, CORE, "/webhooks/sepay", {
            method: "POST",
            headers: { "x-secret-key": readFileSync(siblingFile("SEPAY_IPN_SECRET_KEY"), "utf8").trim() },
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
    const existing = await gql({ jar: learner.jar }, `query Projects { projects { items { id name } } }`).catch(
        () => undefined,
    )
    if (existing === undefined || (existing.projects.items ?? []).length === 0)
        await gql(
            { jar: learner.jar },
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
