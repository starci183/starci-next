/**
 * The notification capability: what a learner is told, stored as a kind and params, never as text.
 *
 * Producer port, called by any part after its own work committed (never from a client door, never inside a transaction):
 *
 *     NotificationProducerPort.notify(learnerId, kind, params, link?) => Promise<void>
 *
 * A part takes it with `@InjectNotificationProducer() private readonly notifications: NotificationProducerPort` (token
 * `NOTIFICATION_PRODUCER`; the app registers `NotificationModule.register({ isGlobal: true })`).
 *
 * - `kind`: "premium.activated" | "premium.revoked" | "experience.verified" | "experience.returned" | "review.due" | "project.milestone-proved" | "project.deployed" (`NOTIFICATION_KINDS`).
 * - `params`: at most 8 flat keys (letters and digits, starting lower-case) with a string (200 chars at most) or a finite number;
 *   they are stored as text and the front end fills its i18n text with them.
 * - `link`: an in-app path starting with a single `/` (no `//`, no backslash, no whitespace, no scheme), or absent.
 * - It never rejects: a refusal or a failed write is logged (`notification.notify_failed`) and the caller goes on. It is not
 *   idempotent, so call it once per event, after the caller's transaction committed.
 *
 * Readers: `NotificationInboxService.page(learnerId, { after?, limit? })` and `markRead(learnerId, { ids? | all? })`.
 */
export { NOTIFICATION_ERROR_KINDS } from "./errors/notification.error"
export { NOTIFICATION_MESSAGES } from "./messages/notification.messages"
export type { NotificationPage } from "./notification.contracts"
export { NotificationModule } from "./notification.module"
export { InjectNotificationProducer, NOTIFICATION_PRODUCER } from "./notification.port"
export type { NotificationProducerPort } from "./notification.port"
export { NotificationInboxService } from "./notification-inbox.service"
export { NotificationService } from "./notification.service"
export { notificationEntities, notificationMigrations } from "./persistence/connection"
