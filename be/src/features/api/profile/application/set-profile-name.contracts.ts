import type { ProfileLocale } from "@modules/domain/profile"

/** The request of the setProfileName door. */
export interface SetProfileNameRequest {
    /** The new display name; null or empty clears it. */
    readonly displayName: string | null
    /** The locale of the answer. */
    readonly locale: ProfileLocale
}
