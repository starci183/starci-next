import type { IdentitySessionRow } from "./persistence/sessions.rows"
import type { KeycloakTokens } from "@modules/integrations/keycloak"
import { toLearnerProfile } from "./learner-profile.policy"
import type { IdentitySessionView, SessionTokens } from "./session.contracts"

/** The authenticated read of one stored session; the sealed token and the digest never leave the store. */
export const toSessionView = (row: IdentitySessionRow): IdentitySessionView => ({
    identity: { subject: row.subject, roles: row.roles, displayName: row.display_name, email: row.email },
    expiresAt: row.expires_at.toISOString(),
})

/** The session material of verified provider tokens: the refresh token and the learner's claims cleaned as untrusted text. */
export const toSessionTokensOf = (tokens: KeycloakTokens): SessionTokens => ({
    subject: tokens.subject,
    roles: tokens.roles,
    ...toLearnerProfile(tokens),
    refreshToken: tokens.refreshToken,
    refreshExpiresAt: tokens.refreshExpiresAt,
})
