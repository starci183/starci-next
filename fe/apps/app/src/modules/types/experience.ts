import type { BadgeTone } from "@starci/grammar/common"
import type { ReviewPreviewView } from "@starci-next/ui"

/** One chip of an item card, already in words: the proof it rests on or who signs it. */
export type ExperienceChip = { readonly id: string; readonly label: string }

/** The editable line of an item the learner can send for review, with what the AI graded. */
export type ExperienceEdit = {
    readonly vi: string
    readonly en: string
    readonly sendLabel: string
    /** The chips of the AI's grade and of the defense questions. */
    readonly chips: ReadonlyArray<ExperienceChip>
}

/** The verification link and the profile switch of a verified item. */
export type ExperienceVerifiedLink = {
    readonly code: string
    readonly url: string
    readonly isShown: boolean
    readonly isCopied: boolean
}

/** One item card of the learner's list, every word resolved. */
export type ExperienceCardView = {
    readonly itemId: string
    /** The source: Essentials, Dự án, Harness or Luyện code. */
    readonly source: string
    readonly state: string
    readonly stateTone: BadgeTone
    /** The date at the head's end: who signed when, when it was sent, graded or returned. */
    readonly dateText: string
    readonly title: string
    readonly subtitle: string | undefined
    readonly tags: ReadonlyArray<ExperienceChip>
    /** The teacher's note of a returned item, drawn in a warm band. */
    readonly returnNote: string | undefined
    /** The line that says what happens next for a pending or practising item. */
    readonly note: string | undefined
    /** The editable line of a sendable item, or undefined when it cannot be sent. */
    readonly edit: ExperienceEdit | undefined
    /** The verification link and profile switch of a verified item, or undefined. */
    readonly verified: ExperienceVerifiedLink | undefined
    /** Why the last write of this item was refused, in words. */
    readonly notice: string | undefined
    readonly isBusy: boolean
    /** A returned item opens its editor on a press; this is whether it is open. */
    readonly isEditing: boolean
    readonly isReturned: boolean
}

/** One tab of the learner's list, with its count. */
export type ExperienceTabView = { readonly id: string; readonly label: string; readonly count: number }

/** One chip of the source filter, with its count. */
export type ExperienceSourceView = { readonly id: string; readonly label: string }

/** One way into an experience, listed when the learner has no item yet. */
export type ExperienceWayView = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly href: string
}

/** One pattern fully Accepted whose experience the learner has not claimed. */
export type ExperienceClaimView = {
    readonly patternId: string
    readonly title: string
    readonly description: string
    readonly isBusy: boolean
}

/** The learner's list as it is drawn. */
export type ExperienceListView = {
    /** The event line under the title: how many verified, how many waiting, what the hiring gate needs. */
    readonly meta: string
    readonly tabs: ReadonlyArray<ExperienceTabView>
    readonly sources: ReadonlyArray<ExperienceSourceView>
    readonly cards: ReadonlyArray<ExperienceCardView>
    /** The four ways in, set only when the learner has no item at all. */
    readonly ways: ReadonlyArray<ExperienceWayView> | undefined
    readonly claims: ReadonlyArray<ExperienceClaimView>
    /** The line a send is confirmed with: the CV line to be sent, or undefined when no send is waiting. */
    readonly confirmLine: string | undefined
}

/** One row of the review queue, every word resolved. */
export type ReviewQueueRowView = {
    readonly itemId: string
    readonly title: string
    readonly meta: string
    readonly sla: string
    readonly slaTone: BadgeTone
    readonly href: string
    readonly isSelected: boolean
}

/** One reviewer appointment, in words. */
export type ReviewerRowView = { readonly id: string; readonly title: string; readonly meta: string }

/** One tab of the review queue. */
export type ReviewQueueTabView = {
    readonly id: string
    readonly label: string
    readonly count?: number
    readonly isAttention?: boolean
}

/** The review queue as it is drawn. */
export type ReviewQueueScreenView = {
    readonly count: string
    readonly tabs: ReadonlyArray<ReviewQueueTabView>
    readonly rows: ReadonlyArray<ReviewQueueRowView>
    readonly preview: ReviewPreviewView | undefined
    readonly reviewers: ReadonlyArray<ReviewerRowView> | undefined
}
