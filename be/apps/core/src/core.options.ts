import type { HttpSecurityOptions } from "@modules/platform/http-security"
import type { ServerOptions } from "@modules/platform/config"
import type { DatabaseConnectionConfig } from "@modules/platform/database"
import type { HttpOptions } from "@modules/platform/http"
import type { CoreEnv } from "./core.env"

/** Everything the core app needs from its environment, parsed by `core.env.ts` and handed to `AppModule.register`. */
export interface CoreOptions {
    /** The HTTP listener. */
    readonly server: ServerOptions
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: HttpSecurityOptions
    /** What the outbound HTTP client trusts beyond Node's bundled certificate authorities. */
    readonly http: HttpOptions
    /** The primary database connection. */
    readonly database: DatabaseConnectionConfig
    /** Parsed application session lifetimes. */
    readonly identity: CoreEnv["identity"]
    /** Parsed registered provider client. */
    readonly keycloak: CoreEnv["keycloak"]
}
