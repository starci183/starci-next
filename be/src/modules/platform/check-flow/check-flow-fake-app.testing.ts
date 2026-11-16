import { randomUUID } from "node:crypto"
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http"
import type { AddressInfo } from "node:net"

/**
 * The behaviours of the fake learner app the fixtures drive. Every flag defaults to the behaviour a concept asks for; a cheat
 * fixture flips one to a wrong behaviour that a learner's green self-written tests could still pass.
 */
export interface FakeAppFlags {
    /** `GET /health`. */
    readonly health: "ok" | "down" | "missing"
    /** `GET /ready`. */
    readonly ready: "ok" | "missing"
    /** The `x-request-id` of every response: echo or mint, none, one constant, or always a new one. */
    readonly requestId: "echo" | "none" | "constant" | "ignore-incoming"
    /** A body that is not valid JSON: refused 400, crash 500, or accepted. */
    readonly validation: "reject" | "crash" | "accept"
    /** The shape of every error: one JSON shape, an HTML 404, a JSON error that leaks a stack, or a 400 shaped unlike the 404. */
    readonly errors: "consistent" | "html-404" | "stack" | "mixed"
    /** `Idempotency-Key`: honoured under concurrency, honoured only one after another, or ignored. */
    readonly idempotency: "full" | "sequential" | "none" | "ignore-body-mismatch"
    /** Who may read an item: its owner, any signed-in user, nobody, or everyone without sign-in. */
    readonly authz: "owner" | "authn-only" | "deny-all" | "open"
    /** A limiter of 10 requests a second: with Retry-After, without it, or none. */
    readonly rateLimit: "full" | "no-retry-after" | "none"
    /** The list: a cursor that holds under inserts, or an offset dressed as a cursor. */
    readonly pagination: "cursor" | "offset"
    /** The profile read: fresh after a write, or served stale from a cache the write does not clear. */
    readonly cache: "fresh" | "stale"
    /** The event of a created item to `X-StarCi-Sink`: once, twice, or never. */
    readonly outbox: "once" | "twice" | "never"
    /** `POST /starci-test/agent` `{message}`: refuses injected orders, obeys them (prints their canary), or crashes on an empty message. */
    readonly agent: "safe" | "obeys" | "crashes"
}

/** The flags of an app that does everything right. */
export const GOOD_APP: FakeAppFlags = {
    health: "ok",
    ready: "ok",
    requestId: "echo",
    validation: "reject",
    errors: "consistent",
    idempotency: "full",
    authz: "owner",
    rateLimit: "full",
    pagination: "cursor",
    cache: "fresh",
    outbox: "once",
    agent: "safe",
}

/** One item of the fake app. */
interface Item {
    readonly id: string
    readonly seq: number
    readonly owner: string | null
    readonly body: unknown
}

/** A reply the fake app sends. */
interface Reply {
    readonly status: number
    readonly body: unknown
    readonly headers?: Readonly<Record<string, string>>
    readonly html?: boolean
}

const RATE_LIMIT = 10
const RATE_WINDOW_MS = 1_000

const readBody = (request: IncomingMessage): Promise<string> =>
    new Promise((resolve) => {
        const chunks: Array<Buffer> = []
        request.on("data", (chunk: Buffer) => chunks.push(chunk))
        request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    })

const parseJson = (text: string): { ok: true; value: unknown } | { ok: false } => {
    try {
        return { ok: true, value: JSON.parse(text) as unknown }
    } catch {
        return { ok: false }
    }
}

const isMessage = (value: unknown): value is { message: string } =>
    typeof value === "object" && value !== null && typeof (value as { message?: unknown }).message === "string"

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => {
        setTimeout(resolve, ms)
    })

/** A fake learner app on 127.0.0.1, driven by flags, that the fixture harness runs every probe and e2e flow against. */
export class FakeLearnerApp {
    private server: Server | null = null
    private readonly items: Array<Item> = []
    private readonly keys = new Map<string, Promise<{ hash: string; reply: Reply }>>()
    private readonly hits: Array<number> = []
    private profile: unknown = { name: "initial" }
    private cachedProfile: unknown = null
    private seq = 0

    constructor(private readonly flags: FakeAppFlags) {}

    /** Starts the app and answers its base address. */
    start(): Promise<string> {
        const server = createServer((request, response) => {
            void this.handle(request, response)
        })
        this.server = server
        return new Promise((resolve) => {
            server.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`))
        })
    }

    /** Stops the app. */
    stop(): Promise<void> {
        const server = this.server
        this.server = null
        return server === null ? Promise.resolve() : new Promise((resolve) => server.close(() => resolve()))
    }

    private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
        const text = await readBody(request)
        const reply = await this.route(request, text)
        this.send(request, response, reply)
    }

    private requestIdOf(request: IncomingMessage): string | null {
        const incoming = request.headers["x-request-id"]
        if (this.flags.requestId === "none") return null
        if (this.flags.requestId === "constant") return "req-1"
        if (this.flags.requestId === "ignore-incoming") return randomUUID()
        return typeof incoming === "string" && incoming !== "" ? incoming : randomUUID()
    }

    private send(request: IncomingMessage, response: ServerResponse, reply: Reply): void {
        const requestId = this.requestIdOf(request)
        const headers: Record<string, string> = {
            "content-type": reply.html === true ? "text/html" : "application/json",
            ...(requestId === null ? {} : { "x-request-id": requestId }),
            ...reply.headers,
        }
        response.writeHead(reply.status, headers)
        response.end(reply.html === true ? String(reply.body) : JSON.stringify(reply.body))
    }

    private error(status: number, code: string, message: string): Reply {
        const { errors } = this.flags
        if (status === 404 && errors === "html-404") {
            return { status, body: "<html><body>Cannot GET</body></html>", html: true }
        }
        if (errors === "mixed" && status === 400) return { status, body: { statusCode: status, message } }
        if (errors === "stack") {
            return {
                status,
                body: { message, stack: "Error: invalid\n    at Object.<anonymous> (/app/src/index.ts:12:5)" },
            }
        }
        return { status, body: { error: { code, message } } }
    }

    private limited(): Reply | null {
        if (this.flags.rateLimit === "none") return null
        const now = Date.now()
        while (this.hits.length > 0 && now - Number(this.hits[0]) > RATE_WINDOW_MS) this.hits.shift()
        this.hits.push(now)
        if (this.hits.length <= RATE_LIMIT) return null
        const base = this.error(429, "RATE_LIMITED", "Too many requests")
        return this.flags.rateLimit === "full" ? { ...base, headers: { "retry-after": "1" } } : base
    }

    private userOf(request: IncomingMessage): string | null {
        const user = request.headers["x-starci-probe-user"]
        return typeof user === "string" && user !== "" ? user : null
    }

    private async route(request: IncomingMessage, text: string): Promise<Reply> {
        const url = new URL(request.url ?? "/", "http://fake")
        const method = request.method ?? "GET"
        if (url.pathname === "/health") return this.health()
        if (url.pathname === "/ready") return this.ready()
        const limited = this.limited()
        if (limited !== null) return limited
        if (url.pathname === "/starci-test/profile") return this.profileRoute(method, text)
        if (url.pathname === "/starci-test/agent" && method === "POST") return this.agentRoute(text)
        if (url.pathname === "/starci-test/items") {
            return method === "POST" ? this.create(request, text) : this.list(url)
        }
        const itemId = /^\/starci-test\/items\/([\w-]+)$/u.exec(url.pathname)?.[1]
        if (itemId !== undefined && method === "GET") return this.read(request, itemId)
        return this.error(404, "NOT_FOUND", "No such route")
    }

    private health(): Reply {
        if (this.flags.health === "missing") return this.error(404, "NOT_FOUND", "No such route")
        return this.flags.health === "ok"
            ? { status: 200, body: { status: "ok" } }
            : { status: 503, body: { status: "down" } }
    }

    private ready(): Reply {
        if (this.flags.ready === "missing") return this.error(404, "NOT_FOUND", "No such route")
        return { status: 200, body: { status: "ready" } }
    }

    private agentRoute(text: string): Reply {
        const parsed = parseJson(text)
        const message = parsed.ok && isMessage(parsed.value) ? parsed.value.message : ""
        if (message === "" && this.flags.agent === "crashes")
            return { status: 500, body: { message: "Cannot read message" } }
        const canary = /STARCI-[A-Z]+-[0-9A-F]+/u.exec(message)?.[0]
        const reply = this.flags.agent === "obeys" && canary !== undefined ? canary : "I will not do that."
        return { status: 200, body: { reply } }
    }

    private profileRoute(method: string, text: string): Reply {
        if (method === "PUT") {
            const parsed = parseJson(text)
            if (!parsed.ok) return this.error(400, "INVALID_JSON", "The body is not JSON")
            this.profile = parsed.value
            if (this.flags.cache === "fresh") this.cachedProfile = null
            return { status: 200, body: this.profile }
        }
        this.cachedProfile ??= this.profile
        return { status: 200, body: this.cachedProfile }
    }

    private async create(request: IncomingMessage, text: string): Promise<Reply> {
        const parsed = parseJson(text)
        if (!parsed.ok) {
            if (this.flags.validation === "crash") return { status: 500, body: { message: "Unexpected token" } }
            if (this.flags.validation === "reject") return this.error(400, "INVALID_JSON", "The body is not JSON")
        }
        const user = this.userOf(request)
        if (this.flags.authz !== "open" && user === null) return this.error(401, "UNAUTHENTICATED", "Sign in first")
        const key = request.headers["idempotency-key"]
        if (typeof key !== "string" || this.flags.idempotency === "none") return this.insert(request, text, user)
        const known = this.keys.get(key)
        if (known !== undefined) {
            const stored = await known
            const mismatch = stored.hash !== text && this.flags.idempotency !== "ignore-body-mismatch"
            return mismatch ? this.error(422, "IDEMPOTENCY_MISMATCH", "Same key, other body") : stored.reply
        }
        if (this.flags.idempotency === "sequential") {
            // Check, then act with no lock: a request that arrives while the first is still writing creates a second item.
            await delay(50)
            const reply = await this.insert(request, text, user)
            this.keys.set(key, Promise.resolve({ hash: text, reply }))
            return reply
        }
        const pending = this.insert(request, text, user).then((reply) => ({ hash: text, reply }))
        this.keys.set(key, pending)
        return (await pending).reply
    }

    private async insert(request: IncomingMessage, text: string, user: string | null): Promise<Reply> {
        this.seq += 1
        const parsed = parseJson(text)
        const item: Item = { id: `it-${this.seq}`, seq: this.seq, owner: user, body: parsed.ok ? parsed.value : null }
        this.items.push(item)
        await this.deliver(request, item)
        return { status: 201, body: { id: item.id, item: item.body } }
    }

    private async deliver(request: IncomingMessage, item: Item): Promise<void> {
        const sink = request.headers["x-starci-sink"]
        if (typeof sink !== "string" || this.flags.outbox === "never") return
        const times = this.flags.outbox === "twice" ? 2 : 1
        const event = JSON.stringify({ type: "item.created", id: item.id, eventId: `ev-${item.id}` })
        for (let sent = 0; sent < times; sent += 1) {
            await fetch(sink, { method: "POST", headers: { "content-type": "application/json" }, body: event })
        }
    }

    private list(url: URL): Reply {
        const limit = Number(url.searchParams.get("limit") ?? "10")
        const cursor = url.searchParams.get("cursor")
        const newest = [...this.items].sort((a, b) => b.seq - a.seq)
        let page: Array<Item>
        if (this.flags.pagination === "offset") {
            const offset = cursor === null ? 0 : Number(cursor)
            page = newest.slice(offset, offset + limit)
            const next = offset + page.length < newest.length ? String(offset + page.length) : null
            return { status: 200, body: { items: page.map((item) => ({ id: item.id })), nextCursor: next } }
        }
        const after = cursor === null ? Number.POSITIVE_INFINITY : Number(cursor)
        page = newest.filter((item) => item.seq < after).slice(0, limit)
        const last = page[page.length - 1]
        return {
            status: 200,
            body: {
                items: page.map((item) => ({ id: item.id })),
                nextCursor: last === undefined ? null : String(last.seq),
            },
        }
    }

    private read(request: IncomingMessage, id: string): Reply {
        const user = this.userOf(request)
        const { authz } = this.flags
        if (authz !== "open" && user === null) return this.error(401, "UNAUTHENTICATED", "Sign in first")
        const item = this.items.find((candidate) => candidate.id === id)
        if (item === undefined) return this.error(404, "NOT_FOUND", "No such item")
        if (authz === "deny-all" || (authz === "owner" && item.owner !== user)) {
            return this.error(403, "FORBIDDEN", "Not yours")
        }
        return { status: 200, body: { id: item.id, item: item.body } }
    }
}
