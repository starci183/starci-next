/** The body the social-exchange door answers; it carries no token, password or code. */
export interface SocialExchangeResponse {
    /** The validated path to land on, or the home path. */
    readonly returnTo: string
}
