import type { MarkdownBlock } from "@starci-next/ui"

/** The phases of a lesson in the order a learner meets them; the overview and the review are not sections of the lesson. */
export const LESSON_PHASES = [
    "overview",
    "challenge",
    "predict",
    "explore",
    "explain",
    "apply",
    "reflect",
    "review",
] as const

/** One phase of the navigator. */
export type LessonPhase = (typeof LESSON_PHASES)[number]

/** The phases a learner without Premium may open. */
export const FREE_PHASES: ReadonlyArray<LessonPhase> = ["overview", "challenge"]

/** How hard a lesson is. */
export type LessonDifficulty = "foundation" | "intermediate" | "advanced"

/** One lesson of the catalog. */
export type CatalogLessonView = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly category: string
    /** The group of the approved tree the catalog files the lesson under. */
    readonly group: string
    /** The topic the lesson belongs to. */
    readonly topic: { readonly id: string; readonly title: string }
    readonly difficulty: LessonDifficulty
    readonly minutes: number
    readonly languages: ReadonlyArray<string>
    readonly providers: ReadonlyArray<string>
}

/** One state of a simulation. */
export type SimulationStateView = {
    readonly id: string
    readonly label: string
    readonly observation: string
    readonly isSuccess: boolean
    /** Counters shown while the state is current (charges: 1, last response: 201). */
    readonly facts: ReadonlyArray<{ readonly label: string; readonly value: string }>
}

/** One edge of a simulation: the action taken in a state and the state it leads to. */
export type SimulationEdgeView = { readonly id: string; readonly fromStateId: string; readonly actionId: string; readonly toStateId: string }

/** The state machine of a simulation, from the public projection. */
export type SimulationView = {
    readonly initialStateId: string
    readonly debriefQuestion: string
    readonly states: ReadonlyArray<SimulationStateView>
    /** `isBranch` is false for a plain step that does not count toward the branches tried. */
    readonly actions: ReadonlyArray<{ readonly id: string; readonly label: string; readonly isBranch: boolean }>
    readonly edges: ReadonlyArray<SimulationEdgeView>
}

/** A file an exercise or a lab hands the learner. */
export type ExerciseFileView = { readonly path: string; readonly language: string; readonly content: string }

/** The lab of one language: its id, the name shown on the switch and its files. */
export type WorkspaceVariantView = {
    readonly id: string
    readonly label: string
    readonly files: ReadonlyArray<ExerciseFileView>
    /** Where the zip of this lab is served; absent for a language the back end does not serve. */
    readonly downloadHref?: string
}

/** One activity before a submit: the question and what the learner answers with, never the answer. */
export type ActivityView = {
    readonly id: string
    readonly kind: "explain" | "choice" | "simulation" | "exercise" | "retrieval"
    readonly prompt: string
    readonly isDiagnostic: boolean
    readonly criteria: ReadonlyArray<string>
    readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
    readonly simulation: SimulationView | undefined
    readonly instructions: string
    readonly files: ReadonlyArray<ExerciseFileView>
}

/** One section of a phase: its title, its body read into blocks and its activities. */
export type SectionView = {
    readonly id: string
    readonly phase: LessonPhase
    readonly title: string
    readonly isLocked: boolean
    readonly blocks: ReadonlyArray<MarkdownBlock>
    /** The body as the raw markdown the teacher wrote; the study screen draws it with Grammar's Markdown. */
    readonly markdown: string
    readonly activities: ReadonlyArray<ActivityView>
}

/** One lesson, in the language of the page, ready to study. */
export type LessonView = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly category: string
    /** The group of the approved tree the lesson belongs to. */
    readonly group: string
    /** The topic the lesson belongs to. */
    readonly topic: { readonly id: string; readonly title: string }
    readonly difficulty: LessonDifficulty
    readonly minutes: number
    readonly implementation: string
    readonly overview: ReadonlyArray<MarkdownBlock>
    /** The overview as raw markdown. */
    readonly overviewMarkdown: string
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly prerequisites: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly references: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
    readonly isPremium: boolean
    /** The version of the content the learner studies; attempts are saved against it. */
    readonly version: string
    readonly sections: ReadonlyArray<SectionView>
    readonly files: ReadonlyArray<ExerciseFileView>
    /** The lab in each language the lesson ships (typescript, java, csharp, go), empty when it ships one only. */
    readonly workspaces: ReadonlyArray<WorkspaceVariantView>
}

/** The graded result of an attempt: a choice, a simulation or a written answer fills its own fields. */
export type AttemptResultView = {
    /** Whether a choice was right; undefined for any other kind. */
    readonly correct: boolean | undefined
    /** Whether a simulation reached its goal; undefined for any other kind. */
    readonly success: boolean | undefined
    readonly reachedStateId: string
    readonly score: number
    readonly maxScore: number
    /** True when the attempt is the opening diagnostic, which does not count toward passing. */
    readonly isDiagnostic: boolean
    readonly options: ReadonlyArray<{
        readonly optionId: string
        readonly isCorrect: boolean
        readonly selected: boolean
        readonly explanation: string
    }>
    readonly criteria: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        /** 0 not yet, 1 half, 2 reached. */
        readonly level: number
        readonly evidence: string
        /**
         * One line of what the answer lacks; empty for a full level.
         * The back end grades it per criterion (`criteria[].missing`); the result card draws it as the "missing" line.
         */
        readonly missing: string
        readonly maxScore: number
    }>
}

/** Where a saved attempt stands on the server. */
export type AttemptServerStatus = "saved" | "grading" | "graded" | "failed"

/** The answer of an attempt as the server kept it; a field that kind of answer does not use is empty. */
export type AttemptAnswerView = {
    readonly optionId: string
    readonly text: string
    readonly actionIds: ReadonlyArray<string>
    readonly reachedStateId: string
    readonly debrief: string
}

/** What the server said about one attempt. */
export type AttemptView = {
    readonly attemptId: string
    readonly activityId: string
    readonly revision: number
    readonly status: AttemptServerStatus
    /** Why a grading failed (ATTEMPT_COACH_UNCONFIGURED, ATTEMPT_COACH_UNAVAILABLE, ATTEMPT_COACH_INVALID, ATTEMPT_COACH_LIMIT_REACHED); empty otherwise. */
    readonly failureCode: string
    /** ISO time the answer was saved (graded time when graded, otherwise the submit time). */
    readonly savedAt: string
    /** What the learner sent, as the server kept it. */
    readonly answer: AttemptAnswerView
    readonly result: AttemptResultView | undefined
}

/** Where an outcome stands, as the server decides it. */
export type OutcomeServerState = "not-started" | "learning" | "mastered" | "needs-review"

/** Where the learner stands in one simulation, as the server kept it. */
export type SimulationProgressView = {
    readonly activityId: string
    readonly currentStateId: string
    /** The path of actions that led to the current state. */
    readonly actionIds: ReadonlyArray<string>
    /** The transitions ever pressed, by transition id. */
    readonly triedTransitionIds: ReadonlyArray<string>
    readonly updatedAt: string
}

/** The learner progress in one lesson. */
export type ProgressView = {
    readonly phase: string
    readonly outcomes: ReadonlyArray<{
        readonly id: string
        readonly understood: number
        readonly proved: number
        readonly state: OutcomeServerState
    }>
    readonly total: number
    /** ISO time the lesson was completed; empty before. */
    readonly completedAt: string
    /** The six phases in order: done once the learner answered all their activities. */
    readonly phases: ReadonlyArray<{
        readonly phase: string
        readonly state: "open" | "done"
        readonly done: number
        readonly total: number
    }>
    readonly activities: ReadonlyArray<{
        readonly activityId: string
        readonly phase: string
        readonly latestAttemptId: string
        readonly latestStatus: string
        /** The latest attempt with its answer and result. */
        readonly latest: AttemptView
    }>
    readonly simulations: ReadonlyArray<SimulationProgressView>
    /** The reviews a completion opens, one per activity and delay; empty until the lesson is completed. */
    readonly reviews: ReadonlyArray<{
        readonly activityId: string
        readonly afterDays: number
        readonly dueOn: string
        readonly done: boolean
    }>
}

/** One lesson of a topic path in the teacher's module order; a lesson not moved yet has no id. */
export type TopicPathRowView = {
    readonly order: number
    readonly title: string
    readonly lessonId: string
}

/** One topic: where it sits, what it covers, its path and the topics around it. */
export type TopicView = {
    readonly id: string
    readonly title: string
    readonly group: string
    /** The old course modules the topic comes from. */
    readonly source: string
    readonly description: string
    readonly prerequisites: ReadonlyArray<string>
    /** The related topics: the title the reader sees and whether the topic is listed (has a published lesson, so it can be opened). */
    readonly related: ReadonlyArray<{ readonly id: string; readonly title: string; readonly listed: boolean }>
    readonly path: ReadonlyArray<TopicPathRowView>
}

/** The answer a learner gives to an activity; a choice fills the option, a written activity the text, a simulation the states it reached. */
export type AttemptAnswer = {
    readonly optionId?: string
    readonly text?: string
    readonly actionIds?: ReadonlyArray<string>
    readonly reachedStateId?: string
    readonly debrief?: string
}
