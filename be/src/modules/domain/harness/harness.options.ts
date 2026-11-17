/** Options of the harness capability. */
export interface HarnessOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The audience a CI run OIDC token must name; the one fixed `starci-next` unless the deployment names another (the same value the project capability verifies). */
    readonly ciOidcAudience?: string
}
