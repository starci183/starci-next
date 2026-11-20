// gallery-sign-in.mjs - DEV ONLY: signs a disposable gallery learner in on the loopback dev stack through the app's own auth doors and saves the
// Playwright storage state (the refresh cookie). A learner who does not exist yet signs up and confirms the emailed link read from the loopback mail sink.
// usage (repo root): node scripts/integration/gallery-sign-in.mjs <credentials.json> <state.json>      credentials.json: { "email": "...", "password": "..." }
// Env: CAPTURE_ORIGIN_AS (the ingress origin sent as Origin of the door calls, for a lane server on its own port), CAPTURE_CORE (default http://localhost:3201), CAPTURE_MAIL (default http://localhost:3292). Refuses anything not on loopback and NODE_ENV=production.
import { readFileSync, writeFileSync } from "node:fs"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])
const fail = (message) => {
    console.error(`gallery-sign-in: ${message}`)
    process.exit(1)
}
const loopback = (value, what) => {
    const url = new URL(value)
    if (!LOOPBACK.has(url.hostname)) fail(`refusing ${url.origin}: ${what} must be on loopback`)
    return url
}
if (process.env.NODE_ENV === "production") fail("refusing to run with NODE_ENV=production")
const CORE = loopback(process.env.CAPTURE_CORE || "http://localhost:3201", "the core api")
const MAIL = loopback(process.env.CAPTURE_MAIL || "http://localhost:3292", "the mail sink")
const AUTH = new URL(`${CORE.origin}/auth/`)
const [, , credFile, stateFile] = process.argv
if (!credFile || !stateFile) fail("usage: node scripts/integration/gallery-sign-in.mjs <credentials.json> <state.json>")
const { email, password } = JSON.parse(readFileSync(credFile, "utf8"))
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

const post = async (path, body, jar) => {
    const answer = await fetch(new URL(path, AUTH), {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: process.env.CAPTURE_ORIGIN_AS || "http://localhost:3280",
        },
        body: JSON.stringify(body),
    })
    for (const line of answer.headers.getSetCookie?.() ?? []) {
        const [pair] = line.split(";")
        const at = pair.indexOf("=")
        if (jar && at > 0) jar.set(pair.slice(0, at), pair.slice(at + 1))
    }
    return answer.status
}
const mailedToken = async (since, kind) => {
    for (let attempt = 0; attempt < 20; attempt++) {
        const list = await (
            await fetch(new URL(`/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`, MAIL))
        ).json()
        for (const message of list.messages ?? []) {
            if (new Date(message.Created).getTime() < since) continue
            const full = await (await fetch(new URL(`/api/v1/message/${message.ID}`, MAIL))).json()
            const token = new RegExp(`/auth/${kind}\?token=([A-Za-z0-9_-]+)`).exec(
                `${full.HTML ?? ""} ${full.Text ?? ""}`,
            )?.[1]
            if (token) return token
        }
        await sleep(500)
    }
    return undefined
}

let jar = new Map()
let status = await post("login", { email, password }, jar)
if (status !== 200) {
    console.log("sign-in refused, signing up")
    const since = Date.now() - 1000
    if ((await post("signup", { email, password, language: "vi" })) !== 204) fail("sign-up refused")
    const token = await mailedToken(since, "confirm")
    if (token === undefined) fail("no confirmation mail reached the sink")
    if ((await post("confirm", { token })) !== 204) fail("the confirmation link was refused")
    jar = new Map()
    status = await post("login", { email, password }, jar)
}
if (status !== 200) fail(`sign-in refused (${status})`)
writeFileSync(
    stateFile,
    JSON.stringify({
        cookies: [...jar].map(([name, value]) => ({
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
    }),
)
console.log(`signed in ${email}; state saved to ${stateFile}`)
