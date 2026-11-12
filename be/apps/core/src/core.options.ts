import type { HttpSecurityOptions } from "@modules/platform/http-security"
import type { ServerOptions } from "@modules/platform/config"
import type { DatabaseConnectionConfig } from "@modules/platform/database"
import type { HttpOptions } from "@modules/platform/http"
import type { AiGatewayOptions } from "@modules/integrations/ai-gateway"
import type { Judge0Options } from "@modules/integrations/judge0"
import type { SepayOptions } from "@modules/integrations/sepay"
import type { PayosOptions } from "@modules/integrations/payos"
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
    /** The SePay channel, or null when this instance serves no SePay rail. */
    readonly sepay: SepayOptions | null
    /** The payOS channel, or null when this instance serves no payOS rail. */
    readonly payos: PayosOptions | null
    /** Parsed application session lifetimes. */
    readonly identity: CoreEnv["identity"]
    /** Parsed registered provider client. */
    readonly keycloak: CoreEnv["keycloak"]
    /** Parsed outgoing mail settings. */
    readonly mail: CoreEnv["mail"]
    /** Parsed purchase settings: the provider return base. */
    readonly purchase: CoreEnv["purchase"]
    /** The AI pool of the coach, or null when this instance has none and written answers are saved but not graded. */
    readonly aiGateway: AiGatewayOptions | null
    /** Parsed attempt settings: the fair-use limit of coach gradings. */
    readonly attempt: CoreEnv["attempt"]
    /** Parsed interview settings: the free quota, the session lengths, the fair-use cap and the verdict lines. */
    readonly interview: CoreEnv["interview"]
    /** The Judge0 endpoint code runs through, or null when this instance runs no code and a run ends as an internal error. */
    readonly judge0: Judge0Options | null
    /** Parsed practice settings: free problems per pattern, the judge queue and the rate limit. */
    readonly practice: CoreEnv["practice"]
    /** Parsed agent lab settings: the daily cap of model calls on the proxy key. */
    readonly agentLab: CoreEnv["agentLab"]
    /** Parsed project settings: free projects and milestones, the probe caps, the CI replay window and the AI code read cap. */
    readonly project: CoreEnv["project"]
    /** Parsed relay settings: the pairing code lifetime, the confirm page, the device limits per plan and the manifest key. */
    readonly relay: CoreEnv["relay"]
    /** The realtime hub the device socket reads. */
    readonly realtime: CoreEnv["realtime"]
}
