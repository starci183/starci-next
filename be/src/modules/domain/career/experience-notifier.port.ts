import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/** The notifications the experience engine sends; the kinds of the notifications capability. */
export type ExperienceNotificationKind = "experience.verified" | "experience.returned"

/** The facts a notification carries for its text: short keys with a string or a number each. */
export type ExperienceNotificationParams = Readonly<Record<string, string | number>>

/**
 * The notifier port of the experience engine: the shape of the notifications capability's producer port
 * `notify(learnerId, kind, params, link)`. The app binds it with `CareerModule.register({ notifier })` once that port ships;
 * until then `SilentNotifierClient` sends nothing. It is called after the decision committed, so a failing notification never
 * undoes a signature.
 */
export interface ExperienceNotifier {
    /** Tells a learner about a decision on one of their items. */
    notify(
        learnerId: string,
        kind: ExperienceNotificationKind,
        params: ExperienceNotificationParams,
        link: string,
    ): Promise<void>
}

/** Token of the experience notifier. */
export const EXPERIENCE_NOTIFIER: unique symbol = Symbol("domain.career.experience-notifier")

/** Injects the experience notifier. Parameter type: ExperienceNotifier. */
export const InjectExperienceNotifier = (): TypedParameterDecorator<ExperienceNotifier> =>
    injector<ExperienceNotifier>(EXPERIENCE_NOTIFIER)
