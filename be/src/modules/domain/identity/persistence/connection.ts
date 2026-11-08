import { IdentityChallengeEntity } from "./entities/identity-challenge.entity"
import { IdentitySessionEntity } from "./entities/identity-session.entity"
import { IdentitySocialBundleEntity } from "./entities/identity-social-bundle.entity"
import { CreateIdentitySessions1793232000000 } from "./migrations/1793232000000-create-identity-sessions"
import { IdentityChallengesAndSessionTokens1794106800000 } from "./migrations/1794106800000-identity-challenges-and-session-tokens"
import { IdentitySessionProfile1797800000000 } from "./migrations/1797800000000-identity-session-profile"

/** Identity's durable state, registered explicitly on the primary connection. */
export const identityEntities: Array<
    typeof IdentityChallengeEntity | typeof IdentitySessionEntity | typeof IdentitySocialBundleEntity
> = [IdentityChallengeEntity, IdentitySessionEntity, IdentitySocialBundleEntity]

/** Identity's reversible schema changes, applied only by the CLI. */
export const identityMigrations: Array<
    | typeof CreateIdentitySessions1793232000000
    | typeof IdentityChallengesAndSessionTokens1794106800000
    | typeof IdentitySessionProfile1797800000000
> = [
    CreateIdentitySessions1793232000000,
    IdentityChallengesAndSessionTokens1794106800000,
    IdentitySessionProfile1797800000000,
]
