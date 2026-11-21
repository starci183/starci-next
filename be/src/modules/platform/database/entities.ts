import { careerEntities } from "@modules/domain/career"
import { attemptEntities } from "@modules/domain/attempt"
import { entitlementEntities } from "@modules/domain/entitlement"
import { harnessEntities } from "@modules/domain/harness"
import { identityEntities } from "@modules/domain/identity"
import { lessonEntities } from "@modules/domain/lesson"
import { mcpEntities } from "@modules/domain/mcp"
import { noteEntities } from "@modules/domain/note"
import { notificationEntities } from "@modules/domain/notification"
import { pathEntities } from "@modules/domain/path"
import { practiceEntities } from "@modules/domain/practice"
import { profileEntities } from "@modules/domain/profile"
import { projectEntities } from "@modules/domain/project"
import { purchaseEntities } from "@modules/domain/purchase"
import { relayEntities } from "@modules/domain/relay"
import { reviewEntities } from "@modules/domain/review"
import { streakEntities } from "@modules/domain/streak"
import { httpSecurityEntities } from "@modules/platform/http-security"
import { inboxEntities } from "@modules/platform/inbox"
import type { EntityClass } from "./database.options"

/**
 * The entity list of the primary connection: each capability's `<c>Entities` array (its `persistence/entities/index.ts`), by
 * name, no glob (the entity registry, slot be.platform.database.entities). Only app composition and the test world import this
 * file, from the deep path `@modules/platform/database/entities`; DatabaseModule and the database barrel never do, since the
 * capability barrels import the database capability back.
 */
export const PRIMARY_ENTITIES: ReadonlyArray<EntityClass> = [
    ...httpSecurityEntities,
    ...inboxEntities,
    ...identityEntities,
    ...entitlementEntities,
    ...purchaseEntities,
    ...profileEntities,
    ...pathEntities,
    ...notificationEntities,
    ...streakEntities,
    ...lessonEntities,
    ...attemptEntities,
    ...reviewEntities,
    ...practiceEntities,
    ...harnessEntities,
    ...relayEntities,
    ...mcpEntities,
    ...projectEntities,
    ...careerEntities,
    ...noteEntities,
]
