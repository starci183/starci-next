import type { ProfileLocale } from "@modules/domain/profile"

/** The request of a public CV. */
export interface GetPublicCvRequest {
    /** The slug of the CV link. */
    readonly slug: string
    /** The locale of the lines. */
    readonly locale: ProfileLocale
}
