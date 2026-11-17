import type { ProfileLocale } from "@modules/domain/profile"

/** The request of the myProfile door. */
export interface GetMyProfileRequest {
    /** The locale of the goal title. */
    readonly locale: ProfileLocale
}
