/** What reading one order takes: its id; whose order it is comes from the session. */
export interface GetPremiumOrderRequest {
    /** The order the learner started. */
    readonly orderId: string
}
