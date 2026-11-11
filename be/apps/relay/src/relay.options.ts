import type { RelayEnv } from "./relay.env"

/** Everything the relay app needs from its environment, parsed by `relay.env.ts` and handed to `AppModule.register`. */
export interface RelayAppOptions {
    /** The HTTP listener. */
    readonly server: RelayEnv["server"]
    /** The origin allowlist and rate limits. */
    readonly httpSecurity: RelayEnv["httpSecurity"]
    /** What the outbound HTTP client trusts. */
    readonly http: RelayEnv["http"]
    /** The primary database connection. */
    readonly database: RelayEnv["database"]
    /** Session lifetimes, for identity's default-deny guard. */
    readonly identity: RelayEnv["identity"]
    /** The registered provider client identity reads sessions through. */
    readonly keycloak: RelayEnv["keycloak"]
    /** Outgoing mail, which identity composes. */
    readonly mail: RelayEnv["mail"]
    /** The relay capability: device limits and the manifest signing key. */
    readonly relay: RelayEnv["relay"]
    /** The realtime hub. */
    readonly realtime: RelayEnv["realtime"]
}
