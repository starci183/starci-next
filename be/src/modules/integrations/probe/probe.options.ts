/** What the app root hands the probe transport capability. */
export interface ProbeModuleOptions {
    /** Whether this capability is available app-wide; only an app composition root may pass `true`. */
    readonly isGlobal?: boolean
}
