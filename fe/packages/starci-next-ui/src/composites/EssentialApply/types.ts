import type { EssenceQuestionView } from "../LessonEssence"
import type { MarkdownLabels } from "../StudyBody/types"

/** The state of a rung as the ladder row words it. */
export type RungState = "locked" | "open" | "doing" | "passed"

/** One rung of the ladder as its row shows it. */
export type LadderRungView = {
    readonly id: string
    readonly level: string
    readonly title: string
    readonly state: RungState
    /** The state in words, for example "Practising 70/100" or "Opens after the level before". */
    readonly stateLabel: string
}

/** One criterion of the rubric with its points and whether the newest run earned them. */
export type RubricRowView = {
    readonly id: string
    readonly criterion: string
    /** The score once a run scored it ("20/20"), the points before ("20 pts"). */
    readonly value: string
    readonly isCritical: boolean
    /** True when earned, false when missed, undefined before any run. */
    readonly isEarned: boolean | undefined
}

/** The rung on screen. */
export type ChallengeDetailView = {
    readonly id: string
    readonly heading: string
    readonly brief: string
    readonly state: RungState
    readonly stateLabel: string
    readonly rubric: ReadonlyArray<RubricRowView>
    /** The essence check of the rung: choices graded on the spot; empty when the rung has none. */
    readonly questions: ReadonlyArray<EssenceQuestionView>
    /** The terminal lines: the command and what the newest run reported. */
    readonly terminal: ReadonlyArray<string>
    readonly score: number
    readonly maxScore: number
    /** True while a locked rung is on screen: only the way to open it is shown. */
    readonly isLocked: boolean
    /** The title and the text that say how a locked rung opens. */
    readonly lockTitle: string
    readonly lockText: string
    /** The current step of the proof chain: 0 run on the machine, 1 push, 2 CI, 3 OIDC, 4 proved. */
    readonly proofStep: number
}

/** The apply part. */
export type ApplyPartView = {
    readonly rungs: ReadonlyArray<LadderRungView>
    readonly selectedId: string
    readonly challenge: ChallengeDetailView | undefined
    /** The line of the profile that the proved rungs add, or empty when none is proved yet. */
    readonly cvLine: string
}

/** The words of the right column of the apply part. */
export type ApplyAsideLabels = {
    readonly score: string
    readonly scoreNote: (max: number) => string
    readonly cvTitle: string
    readonly cvNote: string
    readonly cvNone: string
}

/** Every word of the apply part. */
export type ApplyLabels = {
    readonly markdown: MarkdownLabels
    readonly ladder: string
    readonly critical: string
    readonly rubric: string
    readonly empty: string
    readonly essence: string
    readonly proof: string
    readonly proofSteps: ReadonlyArray<string>
    readonly proofNote: string
    readonly aside: ApplyAsideLabels
}
