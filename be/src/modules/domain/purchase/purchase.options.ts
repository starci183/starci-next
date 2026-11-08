/** Options of the purchase capability. */
export interface PurchaseOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The public origin of the learner's web app, without a trailing slash: the base of every provider return address. */
    readonly returnBaseUrl: string
}
