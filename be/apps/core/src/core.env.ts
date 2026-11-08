import { type EnvSource, parseServerConfig } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpConfig } from "@modules/platform/http"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import { parseAgentLabConfig } from "@modules/domain/agent-lab"
import { parseAttemptConfig } from "@modules/domain/attempt"
import { parseInterviewConfig } from "@modules/domain/interview"
import { parseIdentityConfig } from "@modules/domain/identity"
import { parsePracticeConfig } from "@modules/domain/practice"
import { parseProjectConfig } from "@modules/domain/project"
import { parseRelayConfig } from "@modules/domain/relay"
import type { PurchaseOptions } from "@modules/domain/purchase"
import { parseAiGatewayConfig } from "@modules/integrations/ai-gateway"
import { parseJudge0Config } from "@modules/integrations/judge0"
import { parseKeycloakConfig } from "@modules/integrations/keycloak"
import { parseMailConfig } from "@modules/integrations/mail"
import { parseSepayConfig } from "@modules/integrations/sepay"
import { parsePayosConfig } from "@modules/integrations/payos"

/** The core environment values required before composition. */
export interface CoreEnv {
    /** The HTTP listener. */
    readonly server: ReturnType<typeof parseServerConfig>
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: ReturnType<typeof parseHttpSecurityConfig>
    /** What the outbound HTTP client trusts beyond Node's bundled certificate authorities. */
    readonly http: ReturnType<typeof parseHttpConfig>
    /** The primary database connection. */
    readonly database: ReturnType<typeof parsePrimaryDatabaseConfig>
    /** The SePay channel, or null when the environment declares none. */
    readonly sepay: ReturnType<typeof parseSepayConfig>
    /** The payOS channel, or null when the environment declares none. */
    readonly payos: ReturnType<typeof parsePayosConfig>
    /** Durable application session lifetimes. */
    readonly identity: ReturnType<typeof parseIdentityConfig>
    /** Registered provider and mounted confidential-client custody. */
    readonly keycloak: ReturnType<typeof parseKeycloakConfig>
    /** Outgoing mail: the SMTP server and the sender. */
    readonly mail: ReturnType<typeof parseMailConfig>
    /** The purchase capability: where a provider sends the buyer back to. */
    readonly purchase: PurchaseOptions
    /** The AI pool of the coach, or null when the environment declares no OpenRouter key. */
    readonly aiGateway: ReturnType<typeof parseAiGatewayConfig>
    /** The attempt capability: the fair-use limit of coach gradings. */
    readonly attempt: ReturnType<typeof parseAttemptConfig>
    /** The mock interview capability: the free quota, the session lengths, the fair-use cap and the verdict lines. */
    readonly interview: ReturnType<typeof parseInterviewConfig>
    /** The Judge0 endpoint code runs through, or null when the environment declares none. */
    readonly judge0: ReturnType<typeof parseJudge0Config>
    /** The practice capability: free problems per pattern, the judge queue and the rate limit. */
    readonly practice: ReturnType<typeof parsePracticeConfig>
    /** The agent lab capability: the daily cap of model calls on the proxy key. */
    readonly agentLab: ReturnType<typeof parseAgentLabConfig>
    /** The project capability: free projects and milestones, the probe caps, the CI replay window and the AI code read cap. */
    readonly project: ReturnType<typeof parseProjectConfig>
    /** The relay capability: the pairing code lifetime, the confirm page and the device limits per plan. */
    readonly relay: ReturnType<typeof parseRelayConfig>
}

/** Reads the core environment; missing or invalid values fail boot, and secrets use `_FILE` first. */
export const readCoreEnv = (env: EnvSource): CoreEnv => {
    const httpSecurity = parseHttpSecurityConfig(env)
    return {
        server: parseServerConfig(env),
        httpSecurity,
        http: parseHttpConfig(env),
        database: parsePrimaryDatabaseConfig(env),
        sepay: parseSepayConfig(env),
        payos: parsePayosConfig(env),
        identity: parseIdentityConfig(env),
        keycloak: parseKeycloakConfig(env),
        mail: parseMailConfig(env),
        // The learner's web app is the first allowed browser origin: the one place a provider returns the buyer to.
        purchase: { returnBaseUrl: httpSecurity.allowedOrigins[0] ?? "" },
        aiGateway: parseAiGatewayConfig(env),
        attempt: parseAttemptConfig(env),
        interview: parseInterviewConfig(env),
        judge0: parseJudge0Config(env),
        practice: parsePracticeConfig(env),
        agentLab: parseAgentLabConfig(env),
        project: parseProjectConfig(env),
        relay: parseRelayConfig(env, httpSecurity.allowedOrigins[0] ?? ""),
    }
}
