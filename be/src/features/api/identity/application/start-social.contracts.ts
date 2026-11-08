import type { SocialProvider } from "@modules/integrations/keycloak"

/** Values the start-social door passes on; the domain decides what they mean. */
export interface StartSocialRequest {
    /** The social provider alias. */
    readonly provider: SocialProvider
    /** A same-origin relative path to land on. */
    readonly returnTo?: string
}
