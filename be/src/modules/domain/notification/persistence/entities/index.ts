import { NotificationEntity } from "./notification.entity"

export { NotificationEntity }

/** The entities of the notification capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const notificationEntities: ReadonlyArray<new () => object> = [NotificationEntity]
