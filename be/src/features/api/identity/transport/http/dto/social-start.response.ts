/** The body the social-start door answers; it carries no token, password or code. */
export interface SocialStartResponse {
    /** The provider authorization URL. */
    readonly authorizationUrl: string
}
