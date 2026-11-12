import type { MarkdownBlock } from "../MarkdownBody"

/** The tone of a badge in the review screens. */
export type ReviewTone = "neutral" | "accent" | "success" | "warning" | "danger" | "muted"

/** One grade button: its words, the next interval and its shortcut. */
export type ReviewGradeButton = {
    readonly grade: "AGAIN" | "HARD" | "GOOD" | "EASY"
    readonly label: string
    readonly interval: string
    readonly key: string
}

/** One cloze check of the front. */
export type ReviewClozeView = {
    readonly n: number
    readonly label: string
    readonly choices: ReadonlyArray<string>
    readonly picked: string | undefined
    /** `undefined` before the check answers. */
    readonly result: "correct" | "wrong" | undefined
}

/** One part of the revealed answer. */
export type ReviewAnswerPart = {
    readonly id: string
    readonly title: string | undefined
    readonly blocks: ReadonlyArray<MarkdownBlock>
}

/** The revealed answer with the grade buttons. */
export type ReviewBackView = {
    readonly parts: ReadonlyArray<ReviewAnswerPart>
    readonly grades: ReadonlyArray<ReviewGradeButton>
}

/** The item on screen. */
export type ReviewItemScreen = {
    readonly kind: "item"
    readonly isRetrieval: boolean
    readonly sourceLine: string
    readonly lessonLine: string | undefined
    readonly question: string
    readonly level: string | undefined
    readonly tags: ReadonlyArray<string>
    readonly cloze: ReadonlyArray<ReviewClozeView>
    readonly note: string
    readonly isFlipping: boolean
    readonly issue: "none" | "soon" | "invalid" | "failed"
    /** The revealed answer and the buttons; undefined before the flip. */
    readonly back: ReviewBackView | undefined
    readonly isGrading: boolean
    readonly isGradeFailed: boolean
}

/** The end of the session. */
export type ReviewSummaryScreen = {
    readonly kind: "summary"
    readonly reviewed: string
    readonly recall: string
    readonly goal: string | undefined
    readonly remaining: string
    readonly isAllDone: boolean
}

/** The fixed words of the session. */
export type ReviewSessionLabels = {
    readonly pageTitle: string
    readonly progressLabel: string
    readonly progressText: string
    readonly noteLabel: string
    readonly notePlaceholder: string
    readonly retrievalLabel: string
    readonly retrievalPlaceholder: string
    readonly flip: string
    readonly revealRetrieval: string
    readonly retrievalSoon: string
    readonly retrievalSoonNote: string
    readonly skip: string
    readonly clozeTitle: string
    readonly clozeCorrect: string
    readonly clozeWrong: string
    readonly rateQuestion: string
    readonly rateGroup: string
    readonly shortcuts: string
    readonly saveFailedTitle: string
    readonly saveFailedBody: string
    readonly retry: string
    readonly lockedTitle: string
    readonly lockedBody: string
    readonly upsell: string
    readonly answerError: string
    readonly diagram: string
    readonly diagramError: string
    readonly summaryTitle: string
    readonly summaryReviewed: string
    readonly summaryRecall: string
    readonly summaryGoal: string
    readonly summaryAllDone: string
    readonly summaryBack: string
    readonly summaryHub: string
    readonly emptyBack: string
}

/** The commands of the item the learner works on. */
export type ReviewItemCommands = {
    readonly setNote: (text: string) => void
    readonly pick: (n: number, choice: string) => void
    readonly flip: () => void
    readonly submitAnswer: () => void
    readonly grade: (grade: ReviewBackView["grades"][number]["grade"]) => void
    readonly skip: () => void
    readonly retry: () => void
}
