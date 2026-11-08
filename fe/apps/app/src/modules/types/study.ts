import type {
    ChoiceCardLabels,
    MarkdownBlock,
    OverviewPanelLabels,
    ReflectCompareLabels,
    SimulationCardLabels,
    StudyRailLabels,
    WrittenCardLabels,
} from "@starci-next/ui"
import type { ExerciseFileView, LessonDifficulty, LessonPhase } from "./lesson"

/** Where one activity's attempt stands: nothing sent, running, graded now, accepted to be graded later, refused for Premium or failed. */
export type AttemptStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium" | "error"

/** A reader's way into one phase, drawn as a row of the phase rail. */
type PhaseRailRow = {
    readonly phase: LessonPhase
    readonly href: string
    readonly isCurrent: boolean
    readonly isLocked: boolean
}

/** A written answer a card collects: the question stays in the card, the draft and its attempt are here. */
export type WrittenDraftView = {
    readonly value: string
    readonly status: AttemptStatus
    /** Why the grading failed: no AI provider is configured, or anything else; none while it has not failed. */
    readonly issue: "none" | "unconfigured" | "limit" | "other"
    /** The grade per criterion once the server gave one. */
    readonly criteria: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly level: number
        readonly evidence: string
        readonly maxScore: number
    }>
    /** The score in words, or empty before a grade. */
    readonly scoreLine: string
    /** True for the opening diagnostic, which does not count toward passing. */
    readonly isDiagnostic: boolean
}

/** One card of a phase, ready to draw. */
export type StudyCardView =
    | {
          readonly kind: "reading"
          readonly id: string
          readonly title: string
          readonly blocks: ReadonlyArray<MarkdownBlock>
      }
    | {
          readonly kind: "choice"
          readonly id: string
          readonly prompt: string
          readonly options: ReadonlyArray<{ readonly id: string; readonly label: string }>
          readonly pickedId: string
          readonly status: AttemptStatus
          readonly isCorrect: boolean
          readonly explanations: Readonly<Record<string, string>>
      }
    | {
          readonly kind: "written"
          readonly id: string
          readonly prompt: string
          readonly isDiagnostic: boolean
          readonly criteria: ReadonlyArray<string>
          readonly instructions: string
          readonly draft: WrittenDraftView
      }
    | {
          readonly kind: "simulation"
          readonly id: string
          readonly prompt: string
          readonly steps: ReadonlyArray<{
              readonly id: string
              readonly label: string
              readonly mark: "current" | "seen" | "ahead"
          }>
          readonly currentLabel: string
          readonly observation: string
          readonly isSuccess: boolean
          readonly moves: ReadonlyArray<{ readonly id: string; readonly label: string; readonly toStateId: string }>
          readonly initialStateId: string
          readonly debrief: string
          readonly draft: WrittenDraftView
      }
    | {
          readonly kind: "files"
          readonly id: string
          readonly files: ReadonlyArray<ExerciseFileView>
      }

/** The facts of the overview phase. */
type OverviewView = {
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly prerequisites: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly scope: ReadonlyArray<MarkdownBlock>
    readonly references: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
}

/** One lesson on its study screen: the header facts, the rail and the cards of the phase on screen. */
export type StudyView = {
    readonly id: string
    readonly title: string
    readonly description: string
    /** The group of the lesson in words, resolved by the block. */
    readonly category: string
    readonly topic: { readonly id: string; readonly title: string; readonly href: string }
    readonly difficulty: LessonDifficulty
    /** The difficulty in words, resolved by the block. */
    readonly difficultyLabel: string
    /** The minutes and the implementation language in words, resolved by the block. */
    readonly facts: string
    readonly isPremium: boolean
    readonly phase: LessonPhase
    /** True when the phase on screen needs Premium and the reader has none. */
    readonly isLocked: boolean
    readonly rail: ReadonlyArray<PhaseRailRow>
    readonly overview: OverviewView
    /** One bar per learning outcome, 0 to 100. */
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string; readonly value: number }>
    /** The reflection beside the opening diagnostic, per criterion; levels are 0 to 2, -1 where there is no grade yet. */
    readonly compare: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly before: number
        readonly after: number
    }>
    /** The sections of the phase, when it has several; empty for a phase of one section or a locked one. */
    readonly tabs: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The section on screen, or empty when the phase has none. */
    readonly openTabId: string
    readonly cards: ReadonlyArray<StudyCardView>
}

/** The words of one phase: its name, the line under it in the rail and the sentence that opens it. */
export type PhaseWords = { readonly title: string; readonly sub: string; readonly lead: string }

/** Every word the study screen shows, resolved by its block. */
export type LessonStudyLabels = {
    readonly pageTitle: string
    /** The accessible name of the trail from the catalog to the lesson. */
    readonly breadcrumbs: string
    readonly review: string
    readonly tabs: string
    readonly diagram: string
    readonly diagramError: string
    readonly lockedTitle: string
    readonly lockedDescription: string
    readonly plans: string
    readonly phases: Readonly<Record<LessonPhase, PhaseWords>>
    readonly rail: StudyRailLabels
    readonly overview: OverviewPanelLabels
    readonly compare: ReflectCompareLabels
    readonly choice: ChoiceCardLabels
    readonly written: WrittenCardLabels
    readonly simulation: SimulationCardLabels
}

/** What the learner does on the screen; every argument is an atom. */
export type LessonStudyActions = {
    readonly retry: () => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly write: (activityId: string, text: string) => void
    readonly submitChoice: (activityId: string, optionId: string) => void
    readonly submitWritten: (activityId: string, text: string) => void
    readonly submitDebrief: (activityId: string, text: string) => void
    readonly move: (activityId: string, initialStateId: string, actionId: string, toStateId: string) => void
    readonly restart: (activityId: string) => void
    readonly openTab: (phase: string, sectionId: string) => void
}

/** The words the block resolved for a lesson: its facts and the score line of a graded answer. */
export type StudyWords = {
    readonly category: string
    readonly difficulty: string
    readonly facts: string
    readonly score: (score: number, maxScore: number) => string
}
