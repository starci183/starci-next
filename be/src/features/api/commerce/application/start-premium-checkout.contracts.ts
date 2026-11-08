/** What starting a Premium checkout takes: the plan and rail names the learner chose; the price is never an input. */
export interface StartPremiumCheckoutRequest {
    /** The server-owned plan the learner selected. */
    readonly plan: string
    /** The rail to pay on, or null for the learner's last-used rail. */
    readonly rail: string | null
}
