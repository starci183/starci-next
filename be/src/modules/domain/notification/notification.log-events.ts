/** Events the notification capability records; fields are ids and kinds, never params or links. */
export enum NotificationLogEvent {
    /** A part asked to notify a learner and the notification was refused or not stored; the part's own work is unharmed. */
    NotifyFailed = "notification.notify_failed",
}
