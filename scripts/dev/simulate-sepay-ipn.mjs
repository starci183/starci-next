// simulate-sepay-ipn.mjs - DEV ONLY: stands in for SePay after "Tiep tuc thanh toan" in the local dev stack.
// The dev SePay secrets are sandbox placeholders, so the real gateway can never call back. This posts the IPN the gateway would
// post (ORDER_PAID, authenticated by the `x-secret-key` header, which the sepay client compares with the IPN secret key) to the
// core API's webhook door on loopback, so the pending order settles and the learner becomes Premium.
//
// Usage (from the repo root):  node scripts/dev/simulate-sepay-ipn.mjs [--order-code <code> | --order-id <uuid>] [--core http://localhost:3001]
// With no order argument it picks the newest pending sepay order in the dev database.
// Refuses anything but a loopback core, the dev environment's custody and a loopback database. Prints no secret.
import { spawnSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import { readFileSync } from "node:fs"
import pg from "pg"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"])
const fail = (message) => {
    console.error(`simulate-sepay-ipn: ${message}`)
    process.exit(1)
}

const args = process.argv.slice(2)
const known = new Set(["--order-code", "--order-id", "--core"])
for (const [i, a] of args.entries()) {
    if (a.startsWith("--") && !known.has(a)) fail(`unknown option ${a}`)
    if (!a.startsWith("--") && !known.has(args[i - 1] ?? "")) fail(`unexpected argument ${a}`)
}
const option = (name) => {
    const at = args.indexOf(name)
    return at === -1 ? undefined : args[at + 1]
}

const core = new URL(option("--core") ?? "http://localhost:3001")
if (core.protocol !== "http:" || !LOOPBACK.has(core.hostname))
    fail(`refusing ${core.origin}: only a loopback http core API is allowed`)
if (process.env.NODE_ENV === "production") fail("refusing to run with NODE_ENV=production")

/** Runs `starci app secret get --env dev` (never any other env) and returns the host-local file it names; the value is never printed. */
const devSecretFile = (slug, key) => {
    const run = spawnSync(`npx starci app secret get --env dev ${slug} ${key} --to-file`, {
        encoding: "utf8",
        shell: true,
    })
    const match = /^[A-Z0-9_]+_FILE=([^\r\n]+)/m.exec(`${run.stdout ?? ""}\n${run.stderr ?? ""}`)
    if (run.status !== 0 || !match) fail(`could not open the dev custody for ${slug}/${key} (exit ${run.status})`)
    return match[1].trim()
}

const secretFile = devSecretFile("sepay", "SEPAY_IPN_SECRET_KEY")
const secretKey = readFileSync(secretFile, "utf8").trim()
// The database URL is the sealed dev one `stack up` materializes beside the other dev secret files; only a loopback host is accepted.
const dbUrl = readFileSync(secretFile.replace(/SEPAY_IPN_SECRET_KEY$/, "PRIMARY_DB_URL"), "utf8").trim()
if (!LOOPBACK.has(new URL(dbUrl).hostname)) fail("refusing: the dev database is not on loopback")

const orderCode = option("--order-code")
const orderId = option("--order-id")
const db = new pg.Client({ connectionString: dbUrl })
await db.connect()
let order
try {
    const filters = ["rail = 'sepay'"]
    const params = []
    if (orderCode) {
        params.push(orderCode)
        filters.push(`order_code = $${params.length}`)
    } else if (orderId) {
        params.push(orderId)
        filters.push(`purchase_id = $${params.length}::uuid`)
    } else {
        filters.push("status = 'pending'")
    }
    const { rows } = await db.query(
        `select order_code, amount_vnd, status, currency from purchases where ${filters.join(" and ")} order by created_at desc limit 1`,
        params,
    )
    order = rows[0]
} finally {
    await db.end()
}
if (!order) fail("no matching sepay order (start checkout in the UI first; the rail must be sepay)")
if (order.currency !== "VND") fail(`order currency is ${order.currency}, expected VND`)

const body = {
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
}
const response = await fetch(new URL("/webhooks/sepay", core), {
    method: "POST",
    headers: { "content-type": "application/json", "x-secret-key": secretKey },
    body: JSON.stringify(body),
})
console.log(
    `order ${order.order_code} (${order.amount_vnd} VND, was ${order.status}): core answered ${response.status}`,
)
if (response.status !== 200 && response.status !== 204)
    fail(`the webhook door refused the simulated IPN (${response.status}): ${(await response.text()).slice(0, 300)}`)
console.log("settled: /premium/result turns active within a few seconds")
