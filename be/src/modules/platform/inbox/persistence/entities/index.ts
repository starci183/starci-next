import { InboxClaimEntity } from "./inbox-claim.entity"

export { InboxClaimEntity }

/** The entities of the inbox capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const inboxEntities: ReadonlyArray<new () => object> = [InboxClaimEntity]
