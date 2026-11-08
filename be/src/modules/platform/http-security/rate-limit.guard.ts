import { applyDecorators, Injectable, SetMetadata, type CanActivate, type ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectReflector } from "@modules/platform/composition"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { HttpSecurityError, HttpSecurityErrorCode } from "./errors/http-security.error"
import { requestOf } from "./execution-request.mapper"
import { InjectHttpSecurityOptions } from "./http-security.decorators"
import type { HttpSecurityOptions } from "./http-security.options"
import type { RateWindowRow } from "./persistence/rate-limit.rows"
import { HIT_RATE_WINDOW, PRUNE_RATE_WINDOWS } from "./persistence/rate-limit.sql"

/** The rate limit tiers of a door. */
export enum RateTier {
    /** The global default tier. */
    Default = "default",
    /** The tight tier every authentication handshake and signed webhook carries. */
    Strict = "strict",
    /**
     * The liveness and readiness probes: never counted, because the window store is the primary database and liveness must
     * answer while that database is down. The ingress routes no probe path, so only the orchestrator reaches them.
     */
    Probe = "probe",
}

/** A window of its own inside a tier, counted apart from the tier's shared window under its own limit. */
export enum RateBucket {
    /**
     * The signed provider webhooks: strict like every handshake, but in their own window, so a flood of sign-in attempts
     * never delays a payment confirmation and a provider's retries never lock learners out of sign-in.
     */
    Webhook = "webhook",
}

/** The per-window limit of a tier, or of the bucket a door names inside it. */
const limitOf = (tier: RateTier, bucket: RateBucket | undefined, limits: HttpSecurityOptions["rateLimit"]): number => {
    if (bucket === RateBucket.Webhook) return limits.webhookLimit
    if (tier === RateTier.Strict) return limits.strictLimit
    return limits.defaultLimit
}

const RATE_TIER_KEY = "platform.http-security.rate-tier"
const RATE_BUCKET_KEY = "platform.http-security.rate-bucket"
/** The longest window key the table stores: the tier, the bucket, the colons and the caller address. */
const KEY_MAX = 128

/** The hits of a caller's window and the instant it ends. */
interface CountedWindow {
    readonly hits: number
    readonly resetAt: Date
}

/** What `RateLimit` answers: a decorator that marks a method or a whole class. */
export type RateLimitDecorator = MethodDecorator & ClassDecorator

/** Marks a door with a rate limit tier other than the default, and optionally the bucket of its own window inside it. */
export const RateLimit = (tier: RateTier, bucket?: RateBucket): RateLimitDecorator =>
    applyDecorators(
        SetMetadata(RATE_TIER_KEY, tier),
        ...(bucket === undefined ? [] : [SetMetadata(RATE_BUCKET_KEY, bucket)]),
    )

@Injectable()
/**
 * The first app guard: a fixed-window counter per caller address and tier, stamped by the Clock and kept in the primary
 * database, so every replica counts against the same window. A hit that opens a fresh window also prunes a bounded batch of
 * expired windows.
 */
export class RateLimitGuard implements CanActivate {
    constructor(
        @InjectReflector() private readonly reflector: Reflector,
        @InjectClock() private readonly clock: Clock,
        @InjectHttpSecurityOptions() private readonly options: HttpSecurityOptions,
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
    ) {}

    /** Counts the request and refuses it when the caller is over the limit of the door tier. */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const tier =
            this.reflector.getAllAndOverride<RateTier | undefined>(RATE_TIER_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? RateTier.Default
        if (tier === RateTier.Probe) return true
        const bucket = this.reflector.getAllAndOverride<RateBucket | undefined>(RATE_BUCKET_KEY, [
            context.getHandler(),
            context.getClass(),
        ])
        const limit = limitOf(tier, bucket, this.options.rateLimit)
        const now = this.clock.now()
        const window = bucket === undefined ? tier : `${tier}:${bucket}`
        const key = `${window}:${requestOf(context).ip ?? "unknown"}`.slice(0, KEY_MAX)
        const resetAt = new Date(now.getTime() + this.options.rateLimit.windowMs)
        const counted = await this.hit(key, now, resetAt)
        if (counted.hits > limit) {
            const retryAfterSeconds = Math.max(1, Math.ceil((counted.resetAt.getTime() - now.getTime()) / 1000))
            throw new HttpSecurityError({ code: HttpSecurityErrorCode.RateLimited, params: { retryAfterSeconds } })
        }
        return true
    }

    /**
     * Counts one hit of the window, answers its hits and end, and prunes expired windows when it opened a fresh one. The window store is the primary
     * database, so a store failure answers the required dependency unavailable (503), never an unhandled 500.
     */
    private async hit(key: string, now: Date, resetAt: Date): Promise<CountedWindow> {
        try {
            const rows: Array<RateWindowRow> = await this.entityManager.query(HIT_RATE_WINDOW, [key, now, resetAt])
            const hits = rows[0]?.hits ?? Number.POSITIVE_INFINITY
            if (hits === 1) await this.entityManager.query(PRUNE_RATE_WINDOWS, [now])
            return { hits, resetAt: rows[0]?.resetAt === undefined ? resetAt : new Date(rows[0].resetAt) }
        } catch (cause) {
            throw new HttpSecurityError({ code: HttpSecurityErrorCode.RequiredDependencyUnavailable, cause })
        }
    }
}
