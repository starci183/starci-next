import { NotificationEntity } from "./entities/notification.entity"
import { InitNotification1797400000000 } from "./migrations/1797400000000-init-notification"
import { ProjectKinds1797650000001 } from "./migrations/1797650000001-project-kinds"
import { PremiumRevokedKind1797700000001 } from "./migrations/1797700000001-premium-revoked-kind"

/** The entities of the notification capability. */
export const notificationEntities: Array<typeof NotificationEntity> = [NotificationEntity]

/** The migrations of the notification capability, in the order they run. */
export const notificationMigrations: Array<
    typeof InitNotification1797400000000 | typeof ProjectKinds1797650000001 | typeof PremiumRevokedKind1797700000001
> = [InitNotification1797400000000, ProjectKinds1797650000001, PremiumRevokedKind1797700000001]
