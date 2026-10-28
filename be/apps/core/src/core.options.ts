import type { HttpSecurityOptions } from "@modules/platform/http-security"
import type { ServerOptions } from "@modules/platform/config"
import type { DatabaseConnectionConfig } from "@modules/platform/database"
import type { SepayOptions } from "@modules/integrations/sepay"
import type { PayosOptions } from "@modules/integrations/payos"

/** Everything the core app needs from its environment, parsed by `core.env.ts` and handed to `AppModule.register`. */
export interface CoreOptions {
    /** The HTTP listener. */
    readonly server: ServerOptions
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: HttpSecurityOptions
    /** The primary database connection. */
    readonly database: DatabaseConnectionConfig
    /** The SePay channel, or null when this instance serves no SePay rail. */
    readonly sepay: SepayOptions | null
    /** The payOS channel, or null when this instance serves no payOS rail. */
    readonly payos: PayosOptions | null
}
