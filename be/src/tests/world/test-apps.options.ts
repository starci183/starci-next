/**
 * The typed options the test world hands to the real apps, the migrate step and the platform base of a modules world: what the
 * `main.ts` of each app parses from the environment of a deployment, built from the wiring of the run. The databases are the real
 * ones the library runs; the migrate step is the cli app's own migration runner, the one `cli migrate run` calls.
 */
import type { DynamicModule } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { WorldWiring } from "@starci/test-world"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import type { AiPoolOptions } from "@modules/integrations/ai-pool"
import { lessonContentEntities } from "@modules/domain/lesson-content"
import { DatabaseModule, MigrationRunnerService } from "@modules/platform/database"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import type { HttpSecurityOptions } from "@modules/platform/http-security"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import { AppModule as CliApp } from "../../../apps/cli/src/app.module"
import { readCliEnv } from "../../../apps/cli/src/cli.env"
import { createCliAppOptions } from "../../../apps/cli/src/cli.options"
import type { CliAppOptions } from "../../../apps/cli/src/cli.options"
import { readCoreEnv } from "../../../apps/core/src/core.env"
import type { CoreOptions } from "../../../apps/core/src/core.options"

/** The wiring of the world: its api apps and its database connections. */
export type AppWiring = WorldWiring<"core", "primary">

/** The one browser origin the apps of the world accept. */
export const ALLOWED_ORIGIN = "http://localhost:3000"

/** The environment a deployment hands every app of the run: its mode, its origin allowlist and the URL of every connection. */
const environmentOf = (w: AppWiring, extra: Readonly<Record<string, string>> = {}): EnvSource =>
    new EnvSource({
        NODE_ENV: "test",
        HTTP_SECURITY_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
        PRIMARY_DB_URL: w.db.primary.url,
        OPENROUTER_API_KEY: "test-placeholder-openrouter-api-key",
        ...extra,
    })

/** The core app, read the way its `main.ts` reads its environment, listening on the port the run reserved for it. */
export const coreOptionsOf = (w: AppWiring): CoreOptions =>
    readCoreEnv(environmentOf(w, { PORT: String(w.apps.core.port) }))

/** The origin allowlist and rate limits of the run, read the way the api apps read them. */
export const httpSecurityOf = (w: AppWiring): HttpSecurityOptions => parseHttpSecurityConfig(environmentOf(w))

/** The cli app over the run's databases, read the way its `main.ts` reads its environment. */
export const cliOptionsOf = (w: AppWiring): CliAppOptions => createCliAppOptions(readCliEnv(environmentOf(w)))

/** The migrate step of the run: the cli app composed over the run's databases, running the migrations of every connection. */
export const migrateCli = async (options: CliAppOptions): Promise<void> => {
    const cli = await NestFactory.createApplicationContext(CliApp.register(options), { logger: false })
    try {
        await cli.get(MigrationRunnerService).run()
    } finally {
        await cli.close()
    }
}

/** The platform base of a modules world: the clock, the timer, the logger and the database over the run's connections. */
export const platformBase = (w: AppWiring): ReadonlyArray<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [{ ...cliOptionsOf(w).database, entities: [...lessonContentEntities], migrations: [] }],
    }),
]

/** One request the fake provider edge received: its URL, its bearer alias and its parsed JSON body. */
export interface LessonAiPoolCall {
    /** The full request URL the router called. */
    readonly url: string
    /** The path of the request URL. */
    readonly path: string
    /** The bearer token the request carried, the key alias's resolved value. */
    readonly key: string
    /** The model id the request body named. */
    readonly model: string
    /** Whether the request asked for a stream. */
    readonly stream: boolean
    /** The request headers, names lower-cased. */
    readonly headers: Readonly<Record<string, string>>
    /** The parsed request body. */
    readonly body: Readonly<Record<string, unknown>>
}

/** The token usage a scripted completion reports. */
export interface LessonAiPoolUsage {
    /** The prompt tokens the answer bills. */
    readonly prompt_tokens: number
    /** The completion tokens the answer bills. */
    readonly completion_tokens: number
    /** The total tokens the answer bills. */
    readonly total_tokens: number
}

/** A scripted answer of the fake edge: an HTTP status with headers or a body, a completion text, or a dropped connection. */
export interface LessonAiPoolReply {
    /** The HTTP status the edge answers; default 200. */
    readonly status?: number
    /** Extra response headers, a Retry-After for a 429. */
    readonly headers?: Readonly<Record<string, string>>
    /** The whole response body; wins over `text` and the error shape. */
    readonly body?: unknown
    /** The assistant content of the chat completion the edge answers. */
    readonly text?: string
    /** The usage the answer bills; a default of ten prompt and two completion tokens applies. */
    readonly usage?: LessonAiPoolUsage
    /** `"network"` drops the connection instead of answering. */
    readonly error?: "network"
}

/** The request fields a reply script matches on; every field named must equal the request's. */
export interface LessonAiPoolMatch {
    /** The request URL starts with this base URL. */
    readonly baseUrl?: string
    /** The request carried this bearer token. */
    readonly key?: string
    /** The request named this model id. */
    readonly model?: string
}

/** The fake provider a pool spec stands at the router's network edge: records every request and answers the newest matching script. */
export interface LessonAiPoolFake {
    /** Every request the edge received, oldest first. */
    readonly calls: ReadonlyArray<LessonAiPoolCall>
    /** Scripts a reply: the newest matching script answers, and several replies of one `on` run out in order. */
    on(match: LessonAiPoolMatch, ...replies: ReadonlyArray<LessonAiPoolReply>): LessonAiPoolFake
    /** Forgets every script and every recorded call. */
    reset(): void
    /** The `fetch` the pool calls instead of the network. */
    fetch(input: string, init: RequestInit): Promise<Response>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const fakeMatches = (match: LessonAiPoolMatch, call: LessonAiPoolCall): boolean =>
    (match.baseUrl === undefined || call.url.startsWith(match.baseUrl)) &&
    (match.key === undefined || match.key === call.key) &&
    (match.model === undefined || match.model === call.model)

const fakeAnswer = (reply: LessonAiPoolReply, call: LessonAiPoolCall): unknown => {
    if (reply.body !== undefined) return reply.body
    const status = reply.status ?? 200
    if (status >= 400)
        return {
            error: { message: `fake ${status}`, type: status === 429 ? "rate_limit_exceeded" : "fake_error" },
        }
    return {
        id: "fake-completion",
        object: "chat.completion",
        created: 0,
        model: call.model,
        choices: [{ index: 0, message: { role: "assistant", content: reply.text ?? "ok" }, finish_reason: "stop" }],
        usage: reply.usage ?? { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
    }
}

/** The fake provider of a lesson AI pool spec: an in-process OpenAI-compatible edge injected as the pool's `fetch`. */
export const lessonAiPoolFakeProvider = (): LessonAiPoolFake => {
    let scripts: Array<{ readonly match: LessonAiPoolMatch; readonly replies: Array<LessonAiPoolReply> }> = []
    const calls: Array<LessonAiPoolCall> = []
    const fake: LessonAiPoolFake = {
        calls,
        on(match, ...replies) {
            scripts.unshift({ match, replies: replies.length === 0 ? [{}] : [...replies] })
            return fake
        },
        reset() {
            scripts = []
            calls.length = 0
        },
        fetch(input, init) {
            const headers: Record<string, string> = {}
            new Headers(init.headers).forEach((value, name) => {
                headers[name] = value
            })
            let parsed: unknown = {}
            if (typeof init.body === "string")
                try {
                    parsed = JSON.parse(init.body)
                } catch (error) {
                    return Promise.reject(error)
                }
            const body = isRecord(parsed) ? parsed : {}
            const call: LessonAiPoolCall = {
                url: input,
                path: new URL(input).pathname,
                key: (headers["authorization"] ?? "").replace(/^Bearer /, ""),
                model: typeof body["model"] === "string" ? body["model"] : "",
                stream: body["stream"] === true,
                headers,
                body,
            }
            calls.push(call)
            const script = scripts.find((candidate) => fakeMatches(candidate.match, call))
            let reply: LessonAiPoolReply = {}
            if (script !== undefined)
                reply = script.replies.length > 1 ? (script.replies.shift() ?? {}) : (script.replies[0] ?? {})
            if (reply.error === "network") return Promise.reject(new TypeError("fetch failed"))
            return Promise.resolve(
                new Response(JSON.stringify(fakeAnswer(reply, call)), {
                    status: reply.status ?? 200,
                    headers: { "content-type": "application/json", ...reply.headers },
                }),
            )
        },
    }
    return fake
}

type PoolStore = NonNullable<AiPoolOptions["pool"]["store"]>

/** The breaker or headroom record the pool persists under one provider, key or lane id in its state store. */
export type LessonAiHealthRecord = NonNullable<Awaited<ReturnType<PoolStore["get"]>>>

/** The state store of a lesson pool spec: the records the pool persists, observable by the spec and cleared between scenarios. */
export interface LessonAiPoolHealthStore extends PoolStore {
    /** Empties every record and lease: the store half of a pool reset between scenarios. */
    clear(): void
}

/** The in-memory health store of a lesson pool spec: the records the pool writes, readable by the spec and cleared on `clear()`. */
export const lessonAiPoolHealthStore = (): LessonAiPoolHealthStore => {
    const records = new Map<string, LessonAiHealthRecord>()
    const leases = new Set<string>()
    return {
        get: (key: string) => records.get(key),
        set: (key: string, record: LessonAiHealthRecord): void => {
            records.set(key, record)
        },
        delete: (key: string): void => {
            records.delete(key)
        },
        keys: (prefix: string) => [...records.keys()].filter((key) => key.startsWith(prefix)),
        lease: (key: string) => {
            if (leases.has(key)) return false
            leases.add(key)
            return true
        },
        release: (key: string): void => {
            leases.delete(key)
        },
        clear: () => {
            records.clear()
            leases.clear()
        },
    }
}

/** The breaker state a health read reports for a stored record: an open record past `openUntil` reads half-open. */
export const lessonAiBreakerState = (
    record: LessonAiHealthRecord | undefined,
    now = Date.now(),
): "closed" | "open" | "half-open" => {
    if (record === undefined || record.breaker === "closed") return "closed"
    return record.openUntil > now ? "open" : "half-open"
}
