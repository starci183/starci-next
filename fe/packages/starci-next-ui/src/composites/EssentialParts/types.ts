import type { MarkdownLabels } from "../StudyBody/types"

/** Where the attempt of one question stands. */
export type QuestionStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium"

/** A link out of a graded question: the section to read closely or the scenario that shows the answer. */
export type QuestionLink = { readonly id: string; readonly label: string; readonly href: string }

/** One section of the article or the prose a part opens with, with its mark when a wrong answer pointed at it. */
export type ArticleSectionView = {
    readonly id: string
    readonly title: string
    readonly markdown: string
    readonly isLocked: boolean
    /** True when a wrong opener answer pointed here ("read closely"). */
    readonly isFlagged: boolean
}

/** The words the prose of a part is drawn with, resolved by the app. */
export type EssentialPartsLabels = {
    readonly markdown: MarkdownLabels
    readonly article: { readonly locked: string }
}
