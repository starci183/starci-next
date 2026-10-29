import { IdentitySessionEntity } from "./entities/identity-session.entity"
import { LoginTransactionEntity } from "./entities/login-transaction.entity"
import { CreateIdentitySessions1793232000000 } from "./migrations/1793232000000-create-identity-sessions"

/** Identity's durable state, registered explicitly on the primary connection. */
export const identityEntities = [LoginTransactionEntity, IdentitySessionEntity]

/** Identity's reversible schema changes, applied only by the CLI. */
export const identityMigrations = [CreateIdentitySessions1793232000000]
