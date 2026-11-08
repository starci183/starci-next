import type { EnvSource } from "@modules/platform/config"
import type { HttpSecurityOptions, WebhookProviderOptions } from "./http-security.options"
import { validateAllowedOrigins } from "./edge-security.service"

/** Reads one webhook provider's required signing secret and bounded replay window. */
export const parseWebhookProviderConfig = (env: EnvSource, prefix: string): WebhookProviderOptions => ({
    secret: env.secret(`${prefix}_WEBHOOK_SECRET`),
    toleranceMs: env.duration(`${prefix}_WEBHOOK_TOLERANCE`, 300_000),
})

/** Reads the http-security options: the origin allowlist is required, the rate limits are tunables with literal defaults. */
export const parseHttpSecurityConfig = (env: EnvSource): HttpSecurityOptions => {
    const mode = env.optional("NODE_ENV") ?? "development"
    // Development and test alone admit plain HTTP origins and schema introspection; production and any other mode never do.
    const allowHttpOrigins = mode === "development" || mode === "test"
    const origins = env
        .string("HTTP_SECURITY_ALLOWED_ORIGINS")
        .split(",")
        .map((origin) => origin.trim())
    return {
        allowedOrigins: validateAllowedOrigins(origins, allowHttpOrigins),
        allowHttpOrigins,
        exposeSchema: allowHttpOrigins,
        rateLimit: {
            windowMs: env.duration("HTTP_SECURITY_RATE_WINDOW", 60_000),
            defaultLimit: env.int("HTTP_SECURITY_RATE_DEFAULT_LIMIT", 600),
            strictLimit: env.int("HTTP_SECURITY_RATE_STRICT_LIMIT", 30),
            webhookLimit: env.int("HTTP_SECURITY_RATE_WEBHOOK_LIMIT", 300),
        },
        webhooks: {},
    }
}
