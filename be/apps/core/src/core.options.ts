import type { HttpSecurityOptions } from "@modules/platform/http-security"
import type { ServerOptions } from "@modules/platform/config"
import type { DatabaseConnectionConfig } from "@modules/platform/database"
import type { AiPoolOptions } from "@modules/integrations/ai-pool"

/** Everything the core app needs from its environment, parsed by `core.env.ts` and handed to `AppModule.register`. */
export interface CoreOptions {
    /** The HTTP listener. */
    readonly server: ServerOptions
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: HttpSecurityOptions
    /** The primary database connection. */
    readonly database: DatabaseConnectionConfig
    /** The lesson AI pool: data-only providers, key references and guardrails. */
    readonly aiPool: AiPoolOptions
}
