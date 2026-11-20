import type { GuestChoiceAnswer } from "@modules/domain/attempt"

/** One article section a guest read before signing in. */
export interface GuestSectionRead {
    /** The lesson id. */
    readonly lessonId: string
    /** The section id. */
    readonly sectionId: string
}

/** What a guest did on the device, to be merged into the account that signed in. */
export interface ClaimGuestProgressRequest {
    /** The choices answered, graded again by the server. */
    readonly answers: ReadonlyArray<GuestChoiceAnswer>
    /** The article sections read. */
    readonly sections: ReadonlyArray<GuestSectionRead>
}

/** What the merge did. */
export interface ClaimGuestProgressResult {
    /** The answers stored. */
    readonly answersClaimed: number
    /** The answers left out. */
    readonly answersSkipped: number
    /** The sections marked as read. */
    readonly sectionsClaimed: number
    /** The sections left out (locked, unknown or already read). */
    readonly sectionsSkipped: number
}
