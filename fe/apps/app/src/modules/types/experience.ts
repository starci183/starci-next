import type { BadgeTone } from "@starci/grammar/common"
import type { ReviewPreviewView } from "@starci-next/ui"

/** One evidence chip of an item card, already in words. */
export type ExperienceChip = { readonly id: string; readonly label: string }

/** The editable line of an item the learner can send for review. */
export type ExperienceEdit = { readonly vi: string; readonly en: string; readonly sendLabel: string }

/** The verification link and the profile toggle of a verified item. */
export type ExperienceVerifiedLink = { readonly href: string; readonly code: string; readonly toggleLabel: string }

/** One item card of the learner's list, every word resolved. */
export type ExperienceCardView = {
    readonly itemId: string
    readonly part: string
    readonly state: string
    readonly stateTone: BadgeTone
    /** The caption over the line: CV line, or the readiness signal. */
    readonly lineCaption: string
    readonly line: string
    readonly evidence: ReadonlyArray<ExperienceChip>
    /** The teacher's note of a returned item, drawn first. */
    readonly returnNote: string | undefined
    readonly meta: string
    /** The editable line of a sendable item, or undefined when it cannot be sent. */
    readonly edit: ExperienceEdit | undefined
    /** The verification link and profile toggle of a verified item, or undefined. */
    readonly verified: ExperienceVerifiedLink | undefined
    /** Why the last write of this item was refused, in words. */
    readonly notice: string | undefined
    readonly isBusy: boolean
}

/** One tab of the learner's list, with its count. */
export type ExperienceTabView = { readonly id: string; readonly label: string; readonly count: number }

/** The learner's list as it is drawn. */
export type ExperienceListView = {
    readonly facts: ReadonlyArray<string>
    readonly flow: ReadonlyArray<string>
    readonly tabs: ReadonlyArray<ExperienceTabView>
    readonly cards: ReadonlyArray<ExperienceCardView>
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
