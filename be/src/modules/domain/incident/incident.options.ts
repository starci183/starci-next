/** Options of the incident capability. */
export interface IncidentOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The lessons whose tier-2 incident is written; absent, none. */
    readonly authored?: ReadonlyArray<string>
}
