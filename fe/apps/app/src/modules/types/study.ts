import type { ComponentProps } from "react"
import type { Markdown } from "@starci/grammar/common"
import type {
    ApplyEvidenceLabels,
    ChoiceCardLabels,
    DataSlot,
    OverviewPanelLabels,
    ReflectCompareLabels,
    SimulationAction,
    SimulationProgress,
    SimulationCardLabels,
    SimulationState,
    SimulationStep,
    SimulationTransition,
    SlotLabels,
    StudyRailLabels,
    WrittenCardLabels,
} from "@starci-next/ui"
import type { ExerciseFileView, LessonDifficulty, LessonPhase, WorkspaceVariantView } from "./lesson"

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
        /** What the answer lacks, one line; empty for a full level. */
        readonly missing: string
        readonly maxScore: number
    }>
    /** The score in words, or empty before a grade. */
    readonly scoreLine: string
    /** The score as "2/6", or empty before a grade. */
    readonly scoreShort: string
    /** True for the opening diagnostic, which does not count toward passing. */
    readonly isDiagnostic: boolean
    /** The time the answer was saved, HH:mm; empty before a save. */
    readonly savedAt: string
}

/** One card of a phase, ready to draw. */
export type StudyCardView =
    | {
          readonly kind: "reading"
          readonly id: string
          readonly title: string
          /** The raw markdown, drawn by Grammar's Markdown. */
          readonly markdown: string
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
          /** The right option once graded; empty before. */
          readonly correctId: string
          /** True for the quick check after a theory section (a choice activity of the explain phase). */
          readonly isCheck: boolean
          /** The time the answer was saved, HH:mm; empty before a save. */
          readonly savedAt: string
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
          readonly initialStateId: string
          readonly states: ReadonlyArray<SimulationState>
          readonly actions: ReadonlyArray<SimulationAction>
          readonly transitions: ReadonlyArray<SimulationTransition>
          /** The walk saved earlier, to resume. */
          readonly initialSteps: ReadonlyArray<SimulationStep>
          /** The branches the server saw tried, by action id. */
          readonly initialTriedActionIds: ReadonlyArray<string>
          /** True once the server's saved walk is known; the card starts afresh when it turns true, since it reads its start once. */
          readonly isRestored: boolean
          readonly isSuccess: boolean
          readonly debrief: string
          readonly draft: WrittenDraftView
      }
    | {
          readonly kind: "files"
          readonly id: string
          readonly files: ReadonlyArray<ExerciseFileView>
          /** The lab in several languages, when the lesson ships them. */
          readonly variants?: ReadonlyArray<WorkspaceVariantView>
          /** The language on screen when the files come in several. */
          readonly selectedVariant?: string
          /** Where the zip of the lab is served, when the lab is in one language only; the lab in several carries one per variant. */
          readonly downloadHref?: string
          /** The language of that single lab, in words. */
          readonly downloadLanguage?: string
      }
    | {
          /** The evidence of an exercise: the red test output and the explanation, graded together. */
          readonly kind: "evidence"
          readonly id: string
          readonly task: string
          readonly outputValue: string
          readonly explanationValue: string
          readonly draft: WrittenDraftView
      }

/** The facts of the overview phase. */
type OverviewView = {
    readonly outcomes: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly prerequisites: ReadonlyArray<{ readonly id: string; readonly text: string }>
    /** The scope of the lesson as raw markdown. */
    readonly scope: string
    readonly references: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
}

/** Where a phase stands on the stepper of the band. */
export type StepState = "done" | "current" | "later"

/** One of the six steps of the stepper. */
export type StepView = {
    readonly phase: LessonPhase
    readonly href: string
    readonly state: StepState
    readonly isLocked: boolean
}

/** Where a previous or next control leads: another phase, another section of the theory phase, or beyond the lesson. */
export type NavTarget =
    | { readonly kind: "phase"; readonly phase: LessonPhase; readonly href: string }
    | { readonly kind: "section"; readonly id: string; readonly index: number; readonly title: string }
    | { readonly kind: "lesson"; readonly href: string }

/** The state of an outcome: not started, being learned, understood (graded 4/6 or more in the apply phase and the closing interview), or to review (graded below that once the lesson ended). */
export type OutcomeState = "none" | "learning" | "understood" | "review"

/** How one phase stands in the aside. */
export type PhaseResultView = {
    readonly phase: LessonPhase
    readonly status: "none" | "saved" | "correct" | "wrong" | "graded"
    /** "2/6" for a graded phase; empty otherwise. */
    readonly scoreLine: string
}

/** One theory section's quick check in the aside. */
export type SectionCheckView = {
    readonly id: string
    readonly index: number
    readonly status: "none" | "correct" | "wrong"
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
    /** One row per learning outcome with its state. */
    readonly outcomes: ReadonlyArray<{
        readonly id: string
        readonly text: string
        readonly value: number
        readonly state: OutcomeState
    }>
    /** The art of the phase, served from `public/art/steps`; empty for the overview. */
    readonly imageSrc: string
    /** The question or headline after the phase name in the band's title; empty falls back to the phase name alone. */
    readonly headline: string
    /** The six steps of the band's stepper. */
    readonly stepper: ReadonlyArray<StepView>
    /** The position of the open section among those of the phase (1-based) and their count; 0 when the phase has no sections. */
    readonly sectionIndex: number
    readonly sectionCount: number
    readonly previous: NavTarget | undefined
    readonly next: NavTarget | undefined
    /** The result of each phase, for the aside. */
    readonly phaseResults: ReadonlyArray<PhaseResultView>
    /** The quick checks of the theory sections, for the aside of the theory phase. */
    readonly sectionChecks: ReadonlyArray<SectionCheckView>
    /** Set once every phase is done and the closing interview is graded: when (ISO) the lesson was completed. */
    readonly completedAt: string
    /** The time of the completion, HH:mm. */
    readonly completedTime: string
    /** The reviews opened by the completion: after 1, 7 and 21 days, each with its due date (ISO); empty before completion. */
    readonly reviews: ReadonlyArray<{ readonly days: number; readonly dueAt: string; readonly isDone: boolean }>
    /** The reflection beside the opening diagnostic, per criterion; levels are 0 to 2, -1 where there is no grade yet. */
    readonly compare: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly before: number
        readonly after: number
        /** Why the level moved (or stayed): the quote that earns it, or what is still missing. */
        readonly reason: { readonly kind: "same" | "better" | "worse" | "none"; readonly detail: string; readonly missing: string }
    }>
    /** The totals of the opening diagnostic and of the closing interview, for the "2/6 → 5/6" chip; empty before the grade. */
    readonly compareScore: string
    /** The sections of the phase, when it has several; empty for a phase of one section or a locked one. */
    readonly tabs: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The section on screen, or empty when the phase has none. */
    readonly openTabId: string
    readonly cards: ReadonlyArray<StudyCardView>
}

/** The words of one phase: its name, the line under it in the rail and the sentence that opens it. */
export type PhaseWords = { readonly title: string; readonly sub: string; readonly lead: string }

/** The words Grammar's Markdown speaks itself. */
export type MarkdownLabels = NonNullable<ComponentProps<typeof Markdown>["labels"]>

/** The words of the previous and next controls, of the band's meta line and of the stepper. */
export type LessonNavLabels = {
    /** The accessible name of the stepper of the six phases. */
    readonly stepper: string
    /** The accessible words of a step's state. */
    readonly stepStates: Readonly<Record<StepState, string>>
    /** "Pha {n}/{total}". */
    readonly phaseOf: (n: number, total: number) => string
    /** The part of a theory phase, e.g. part 3 of 4. */
    readonly sectionOf: (n: number, total: number) => string
    /** The word for a phase that needs no Premium. */
    readonly free: string
    /** The neutral button back to the phase before. */
    readonly previousPhase: string
    /** The purple button on to the next phase, with its title. */
    readonly nextPhase: (title: string) => string
    readonly previousSection: string
    /** The purple button on to the next theory section, with its number and title. */
    readonly nextSection: (n: number, title: string) => string
    readonly nextLesson: string
}

/** The words of a graded result card of a written answer. */
export type LessonResultLabels = {
    /** The heading of the result card. */
    readonly title: string
    /** The saved-at words with the time. */
    readonly savedAt: (time: string) => string
    /** The prefix of the line that says what the answer lacks. */
    readonly missing: string
    /** The words for level 0, 1 and 2. */
    readonly levels: readonly [string, string, string]
    /** The line that closes the card of the opening diagnostic. */
    readonly diagnosticNote: string
    /** The heading of the card that explains each option of a prediction. */
    readonly why: string
    /** The heading of the quick-check block. */
    readonly check: string
}

/** The words of the before-and-after of the closing interview. */
export type LessonCompareLabels = {
    readonly title: string
    readonly criterion: string
    readonly before: string
    readonly after: string
    readonly why: string
    readonly none: string
    readonly levels: readonly [string, string, string]
    readonly same: string
    readonly better: string
    readonly worse: string
    readonly missing: string
    readonly empty: string
}

/** The words of the completion card of the lesson. */
export type LessonCompletionLabels = {
    readonly title: string
    /** The line that says the lesson is finished. */
    readonly done: (lesson: string) => string
    readonly reviewsOpen: string
    readonly reviewsLink: string
    readonly project: string
    readonly projectLink: string
}

/** The words of the lesson progress aside. */
export type LessonProgressLabels = {
    readonly title: string
    readonly outcomes: string
    /** The words of an outcome state. */
    readonly outcomeStates: Readonly<Record<OutcomeState, string>>
    /** The one-line rule under the outcomes. */
    readonly rule: string
    readonly phases: string
    readonly phaseStatus: Readonly<Record<PhaseResultView["status"], string>>
    /** The word for a saved answer. */
    readonly saved: string
    /** The title of the progress of the theory phase. */
    readonly checksTitle: string
    /** The row of the quick check of theory section n. */
    readonly checkRow: (n: number) => string
    readonly checkStatus: Readonly<Record<SectionCheckView["status"], string>>
    readonly reviews: string
    /** Said until the lesson is completed. */
    readonly reviewsLocked: string
    /** The words of a review that falls due after the given days. */
    readonly reviewAfter: (days: number) => string
    /** A due date as "dd/MM". */
    readonly dateOf: (iso: string) => string
}

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
    /** The noun label of the card that lists the model source files. */
    readonly filesLabel: string
    /** The accessible name of the language switch of the lab files. */
    readonly languageLabel: string
    readonly phases: Readonly<Record<LessonPhase, PhaseWords>>
    readonly rail: StudyRailLabels
    readonly overview: OverviewPanelLabels
    readonly compare: ReflectCompareLabels
    readonly choice: ChoiceCardLabels
    readonly written: WrittenCardLabels
    readonly simulation: SimulationCardLabels
    readonly evidence: ApplyEvidenceLabels
    readonly nav: LessonNavLabels
    readonly result: LessonResultLabels
    readonly lessonCompare: LessonCompareLabels
    readonly completion: LessonCompletionLabels
    readonly progress: LessonProgressLabels
    /** The words Grammar's Markdown speaks itself. */
    readonly markdown: MarkdownLabels
    /** The verb of a file row's command and the accessible name of the code view's close button. */
    readonly filesOpen: string
    /** The words of the download of a lab's zip for a language: "Download workspace Java (.zip)". */
    readonly filesDownload: (language: string) => string
    readonly filesClose: string
}

/** What the learner does on the screen; every argument is an atom. */
export type LessonStudyActions = {
    readonly pickLanguage: (language: string) => void
    readonly retry: () => void
    readonly pick: (activityId: string, optionId: string) => void
    readonly write: (activityId: string, text: string) => void
    readonly submitChoice: (activityId: string, optionId: string) => void
    readonly submitWritten: (activityId: string, text: string) => void
    readonly submitDebrief: (activityId: string, text: string) => void
    /** The walk of a simulation changed; the screen keeps it. */
    readonly walk: (activityId: string, progress: SimulationProgress) => void
    /** One field of an apply evidence changed. */
    readonly writeEvidence: (activityId: string, field: "output" | "explanation", text: string) => void
    readonly submitEvidence: (activityId: string, output: string, explanation: string) => void
    readonly openTab: (phase: string, sectionId: string) => void
    /** Opens another phase of the lesson (the stepper). */
    readonly openPhase: (phase: string) => void
}

/** The words the block resolved for a lesson: its facts and the score line of a graded answer. */
export type StudyWords = {
    readonly category: string
    readonly difficulty: string
    readonly facts: string
    readonly score: (score: number, maxScore: number) => string
}

/** What the connected study screen hands the presentational block: the lesson as a data slot with its words and destinations, and the actions. */
export type LessonStudyScreen = {
    readonly props: {
        readonly slot: DataSlot<StudyView>
        readonly placeholder: StudyView
        readonly slotLabels: SlotLabels
        readonly labels: LessonStudyLabels
        /** The destination of the plans page. */
        readonly plansHref: string
        /** The destination of the catalog. */
        readonly catalogHref: string
        /** The destinations the completion card leads to: the review schedule and the projects. */
        readonly reviewHref: string
        readonly projectsHref: string
    }
    readonly on: LessonStudyActions
}
