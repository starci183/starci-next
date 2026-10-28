import { Injectable } from "@nestjs/common"
import type { CanActivate, ExecutionContext } from "@nestjs/common"
import type { Reflector } from "@nestjs/core"
import { InjectReflector } from "@modules/platform/composition"
import { HttpSecurityError, HttpSecurityErrorCode } from "./errors/http-security.error"
import { requestOf } from "./execution-request.mapper"
import { InjectHttpSecurityOptions, REQUIRE_ORIGIN_KEY } from "./http-security.decorators"
import type { HttpSecurityOptions } from "./http-security.options"

const SAFE_METHODS: ReadonlySet<string> = new Set(["GET", "HEAD", "OPTIONS"])

const originOf = (origin: string | undefined, referer: string | undefined): string | undefined => {
    if (origin) return origin
    return referer && URL.canParse(referer) ? new URL(referer).origin : undefined
}

@Injectable()
/**
 * The second app guard, the CSRF defence: cookie-bearing mutations and doors marked RequireOrigin need an actual allowed
 * Origin. Other mutations retain Referer fallback and admission without a usable origin; safe methods are not judged.
 */
export class OriginGuard implements CanActivate {
    constructor(
        @InjectReflector() private readonly reflector: Reflector,
        @InjectHttpSecurityOptions() private readonly options: HttpSecurityOptions,
    ) {}

    /** Refuses a cookie-authenticated mutation without an allowed Origin, or another mutation from a foreign origin. */
    canActivate(context: ExecutionContext): boolean {
        const request = requestOf(context)
        if (SAFE_METHODS.has(request.method)) return true
        const requiresOrigin =
            this.reflector.getAllAndOverride<boolean | undefined>(REQUIRE_ORIGIN_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) === true || request.headers.cookie !== undefined
        const origin = requiresOrigin
            ? request.headers.origin
            : originOf(request.headers.origin, request.headers.referer)
        if (origin === undefined ? !requiresOrigin : this.options.allowedOrigins.includes(origin)) return true
        throw new HttpSecurityError({ code: HttpSecurityErrorCode.OriginRejected })
    }
}
