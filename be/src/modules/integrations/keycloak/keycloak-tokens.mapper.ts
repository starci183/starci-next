import type { OidcBrokerSession, OidcGrant } from "@starci/auth-oidc/server"
import type { KeycloakTokens } from "./keycloak.options"

/** A grant as the identity port sees it: the verified access token's account, plus its `preferred_username` and `name` claims. */
export const toGrantTokens = (grant: OidcGrant): KeycloakTokens => ({
    subject: grant.subject,
    roles: grant.roles,
    email: grant.email,
    username: grant.principal.username ?? null,
    name: grant.principal.name ?? null,
    refreshToken: grant.refreshToken,
    refreshExpiresAt: grant.refreshExpiresAt,
})

/** A social sign-in as the identity port sees it: the code exchange verifies the ID token but answers no name claim. */
export const toSocialTokens = (session: OidcBrokerSession): KeycloakTokens => ({
    subject: session.subject,
    roles: session.roles,
    email: session.email,
    username: null,
    name: null,
    refreshToken: session.refreshToken,
    refreshExpiresAt: session.refreshExpiresAt,
})
