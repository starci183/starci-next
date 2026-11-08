import { Injectable } from "@nestjs/common"
import type {
    ExperienceNotificationKind,
    ExperienceNotificationParams,
    ExperienceNotifier,
} from "./experience-notifier.port"

@Injectable()
/**
 * The notifier bound while the app names none: it sends nothing. Call site waiting for the notifications capability's producer
 * port (NOTIFICATIONS_PRODUCER_PENDING): the app swaps this client for an adapter over `notify(learnerId, kind, params, link)`.
 */
export class SilentNotifierClient implements ExperienceNotifier {
    /** Sends nothing. */
    notify(
        _learnerId: string,
        _kind: ExperienceNotificationKind,
        _params: ExperienceNotificationParams,
        _link: string,
    ): Promise<void> {
        return Promise.resolve()
    }
}
