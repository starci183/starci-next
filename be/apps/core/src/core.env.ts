import { type EnvSource, parseServerConfig } from "@modules/platform/config"
import { parsePrimaryDatabaseConfig } from "@modules/platform/database"
import { parseHttpConfig } from "@modules/platform/http"
import { parseHttpSecurityConfig } from "@modules/platform/http-security"
import { parseRealtimeConfig } from "@modules/platform/realtime"
import { parseAttemptConfig } from "@modules/domain/attempt"
import { parseIdentityConfig } from "@modules/domain/identity"
import { parsePracticeConfig } from "@modules/domain/practice"
import { parseProfileConfig } from "@modules/domain/profile"
import { parseProjectConfig } from "@modules/domain/project"
import { parseMcpConfig } from "@modules/domain/mcp"
import { parseRelayConfig } from "@modules/domain/relay"
import { parseProbeConfig } from "@modules/integrations/probe"
import type { PurchaseOptions } from "@modules/domain/purchase"
import { parseAiGatewayConfig } from "@modules/integrations/ai-gateway"
import { parseJudge0Config } from "@modules/integrations/judge0"
import { parseKeycloakConfig } from "@modules/integrations/keycloak"
import { parseMailConfig } from "@modules/integrations/mail"
import { parseObjectStorageConfig } from "@modules/integrations/object-storage"
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
    /** S3-compatible object storage: the endpoint, the public origin links are built on, the bucket and the keys. */
    readonly objectStorage: ReturnType<typeof parseObjectStorageConfig>
    /** The purchase capability: where a provider sends the buyer back to. */
    readonly purchase: PurchaseOptions
    /** The AI pool of the coach, or null when the environment declares no OpenRouter key. */
    readonly aiGateway: ReturnType<typeof parseAiGatewayConfig>
    /** The attempt capability: the fair-use limit of coach gradings. */
    readonly attempt: ReturnType<typeof parseAttemptConfig>
    /** The Judge0 endpoint code runs through, or null when the environment declares none. */
    readonly judge0: ReturnType<typeof parseJudge0Config>
    /** The practice capability: free problems per pattern, the judge queue and the rate limit. */
    readonly practice: ReturnType<typeof parsePracticeConfig>
    /** The project capability: free projects and milestones, the probe caps, the CI replay window and the AI code read cap. */
    readonly project: ReturnType<typeof parseProjectConfig>
    /** The profile capability: the avatar size and type limits, the longest display name and the signed upload lifetime. */
    readonly profile: ReturnType<typeof parseProfileConfig>
    /** The probe transport options (no key of its own: the transport reaches public addresses only). */
    readonly probe: ReturnType<typeof parseProbeConfig>
    /** The relay capability: the pairing code lifetime, the confirm page, the device limits per plan and the manifest key. */
    readonly relay: ReturnType<typeof parseRelayConfig>
    /** The realtime hub the device socket reads (memory, one replica). */
    readonly realtime: ReturnType<typeof parseRealtimeConfig>
    /** The mcp capability: the token limit, the lesson checkouts, the public endpoint and the local embedder. */
    readonly mcp: ReturnType<typeof parseMcpConfig>
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
        objectStorage: parseObjectStorageConfig(env),
        // The learner's web app is the first allowed browser origin: the one place a provider returns the buyer to.
        purchase: { returnBaseUrl: httpSecurity.allowedOrigins[0] ?? "" },
        aiGateway: parseAiGatewayConfig(env),
        attempt: parseAttemptConfig(env),
        judge0: parseJudge0Config(env),
        practice: parsePracticeConfig(env),
        project: parseProjectConfig(env),
        profile: parseProfileConfig(env),
        probe: parseProbeConfig(env),
        relay: parseRelayConfig(env, httpSecurity.allowedOrigins[0] ?? ""),
        realtime: parseRealtimeConfig(env),
        mcp: parseMcpConfig(env),
    }
}
