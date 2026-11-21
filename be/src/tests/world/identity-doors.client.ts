import { TestWorldError, TestWorldErrorCode, type HttpResponse, type TestApi, type WorldMail } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import type { GrantBody, Learner } from "../fixtures/builders/learner.builder"
import { ALLOWED_ORIGIN } from "./test-apps.options"

interface CountRow {
    readonly n: number
}

/** The booted core app of a world. */
interface CoreHandle {
    readonly api: TestApi
}

/** The apps a world booted. */
interface WorldApps {
    readonly core?: CoreHandle | undefined
}

/** The databases a world runs. */
interface WorldDatabases {
    readonly primary?: EntityManager | undefined
}

/** What the doors need of a booted world: the core app, the primary database and the mail sink. */
export interface DoorsWorld {
    readonly apps: WorldApps
    readonly db: WorldDatabases
    readonly mail: WorldMail
}

/** Extra request headers. */
type Headers = Readonly<Record<string, string>>

/** A signed-in learner: the `Authorization` header value the doors take, the learner id and the refresh cookie pair. */
export interface SignedInLearner {
    /** `Bearer <access token>`, for the `authorization` header. */
    readonly bearer: string
    /** The account id: the learner id every domain keys on. */
    readonly subject: string
    /** The refresh cookie as `name=value`, for the refresh, session and logout doors. */
    readonly refresh: string
}

/** The handle a spec drives the auth doors with. */
export interface IdentityDoors {
    /** POSTs a body from the allowed origin, plus any extra headers. */
    post<T>(path: string, body?: unknown, headers?: Headers): Promise<HttpResponse<T>>
    /** GETs a path with optional headers. */
    get<T>(path: string, headers?: Headers): Promise<HttpResponse<T>>
    /** The link token of the latest mail sent to an address. */
    linkTokenSentTo(email: string): Promise<string>
    /** Clears the rate windows and the mailbox so a test starts fresh. */
    reset(): Promise<void>
    /** The number of device sessions. */
    activeSessions(): Promise<number>
    /** Signs the learner up and spends the confirmation link: the account exists, confirmed, with the learner's password. */
    register(learner: Learner): Promise<void>
    /** Registers the learner and signs in over the doors: the bearer, the learner id and the refresh cookie. */
    signInSession(learner: Learner): Promise<SignedInLearner>
    /** Registers the learner, signs in and answers the `Authorization` header value. */
    signIn(learner: Learner): Promise<string>
}

const RATE_WINDOWS = sql`DELETE FROM http_security_rate_windows`
const ATTEMPTS = sql`DELETE FROM identity_attempts`
const ACTIVE_SESSIONS = sql`SELECT count(*)::int AS n FROM identity_sessions`

/** The `name=value` pair of the refresh cookie in a Set-Cookie header (one value or a joined list). */
const refreshPair = (setCookie: string | undefined): string =>
    (setCookie ?? "")
        .split(/, (?=[A-Za-z_-]+=)/u)
        .find((cookie) => cookie.startsWith("refresh_token="))
        ?.split(";")[0] ?? ""

const undeclared = (detail: string): Promise<never> =>
    Promise.reject(new TestWorldError({ code: TestWorldErrorCode.NotDeclared, params: { detail } }))

/** Drives the auth doors of the booted core app and the mail sink; a world that boots no core app answers every call with a rejection naming it. */
export const identityDoors = (world: DoorsWorld): IdentityDoors => {
    const core = world.apps.core
    const database = world.db.primary
    const coreApi = (): Promise<TestApi> =>
        core === undefined ? undeclared("the world boots no core app") : Promise.resolve(core.api)
    const primary = (): Promise<EntityManager> =>
        database === undefined ? undeclared("the world runs no primary database") : Promise.resolve(database)
    const mailbox = world.mail
    const post = async <T>(path: string, body?: unknown, headers: Headers = {}) =>
        (await coreApi()).post<T>(path, body, { headers: { origin: ALLOWED_ORIGIN, ...headers } })
    const linkTokenSentTo = async (email: string): Promise<string> => {
        const mail = await mailbox.waitFor(email)
        const found = /token=([^\s&"'<>]+)/u.exec(mail.text.length > 0 ? mail.text : mail.html)
        return decodeURIComponent(found?.[1] ?? "")
    }
    const register = async (learner: Learner): Promise<void> => {
        await mailbox.clear()
        await post("/auth/signup", { email: learner.email, password: learner.password, name: learner.username })
        await post("/auth/confirm", { token: await linkTokenSentTo(learner.email) })
    }
    const signInSession = async (learner: Learner): Promise<SignedInLearner> => {
        await register(learner)
        const login = await post<GrantBody>("/auth/login", { email: learner.email, password: learner.password })
        return {
            bearer: `Bearer ${login.body.accessToken}`,
            subject: login.body.user.id,
            refresh: refreshPair(login.headers["set-cookie"]),
        }
    }
    return {
        post,
        get: async <T>(path: string, headers: Headers = {}) => (await coreApi()).get<T>(path, { headers }),
        linkTokenSentTo,
        reset: async () => {
            const manager = await primary()
            await manager.query(RATE_WINDOWS)
            await manager.query(ATTEMPTS)
            await mailbox.clear()
        },
        activeSessions: async () => (await (await primary()).query<Array<CountRow>>(ACTIVE_SESSIONS))[0]?.n ?? 0,
        register,
        signInSession,
        signIn: async (learner) => (await signInSession(learner)).bearer,
    }
}

/** The learner id an `Authorization: Bearer <access token>` value was issued to: the `sub` claim of its payload. */
export const subjectOfBearer = (bearer: string): string => {
    const payload = bearer.replace(/^Bearer /u, "").split(".")[1] ?? ""
    const claims: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    return typeof claims === "object" && claims !== null && "sub" in claims && typeof claims.sub === "string"
        ? claims.sub
        : ""
}
