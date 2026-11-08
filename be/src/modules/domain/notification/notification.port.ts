import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { NotificationKind, NotificationParams } from "./notification.contracts"

/**
 * The port through which a part tells a learner something happened. The notification capability stores the kind and the
 * params and never any text; the front end words each notification from its i18n keys and the params.
 */
export interface NotificationProducerPort {
    /**
     * Stores one unread notification for the learner, newest first in the inbox. It never rejects: a refused kind, params
     * or link and a failed write are logged (`notification.notify_failed`) and the caller's flow goes on, so call it after
     * the caller's own transaction committed, never inside it (a failed statement would abort that transaction anyway).
     * It is not idempotent: a caller that can repeat the same event calls it once per event, behind its own once-only guard.
     */
    notify(learnerId: string, kind: NotificationKind, params: NotificationParams, link?: string): Promise<void>
}

/** Token of the notification producer port. */
export const NOTIFICATION_PRODUCER: unique symbol = Symbol("domain.notification.producer")

/** Injects the notification producer port. Parameter type: NotificationProducerPort. */
export const InjectNotificationProducer = (): TypedParameterDecorator<NotificationProducerPort> =>
    injector<NotificationProducerPort>(NOTIFICATION_PRODUCER)
