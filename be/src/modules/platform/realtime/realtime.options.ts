/** The hub an app runs; only the in-process memory hub is built, for one replica (BE-REALTIME-7). */
export interface RealtimeConfig {
    /** The hub kind. */
    readonly hub: "memory"
}

/** Options of the realtime capability. */
export interface RealtimeOptions extends RealtimeConfig {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
}
