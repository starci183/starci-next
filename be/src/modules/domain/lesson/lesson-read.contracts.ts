import type { LessonTopicRef } from "./lesson-topic-view.contracts"
import type {
    LessonLocale,
    LessonPhase,
    LessonDifficulty,
    LessonActivityKind,
    LessonStatement,
    LessonSimulationState,
    LessonSimulationAction,
    LessonSimulationTransition,
    LessonExerciseFile,
    LessonActivity,
    LessonWorkspaceFile,
} from "./lesson.contracts"

/** The filters of the catalog. */
export interface LessonCatalogFilter {
    /** The locale of the titles. */
    readonly locale: LessonLocale
    /** Only this group, or null for every group. */
    readonly group: string | null
    /** Only this topic, or null for every topic. */
    readonly topic: string | null
    /** Only this category, or null for every category. */
    readonly category: string | null
    /** Only this difficulty, or null for every difficulty. */
    readonly difficulty: LessonDifficulty | null
    /** Only lessons with this implementation language, or null. */
    readonly language: string | null
    /** Only lessons with this cloud provider, or null. */
    readonly provider: string | null
    /** Only lessons whose title or description contains this text, or null. */
    readonly q: string | null
}

/** One lesson in the catalog. */
export interface LessonCatalogItemView {
    /** The lesson id. */
    readonly id: string
    /** The live version. */
    readonly version: string
    /** The title in the asked locale. */
    readonly title: string
    /** The description in the asked locale. */
    readonly description: string
    /** The category. */
    readonly category: string
    /** The catalog group. */
    readonly group: string
    /** The topic. */
    readonly topic: LessonTopicRef
    /** The difficulty. */
    readonly difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    readonly minutes: number
    /** The implementation languages; empty for an agnostic concept. */
    readonly languages: ReadonlyArray<string>
    /** The cloud providers; empty until a lesson has any. */
    readonly providers: ReadonlyArray<string>
}

/** A criterion as the learner sees it before a submit: the name and the points, never the evidence. */
export interface LessonCriterionView {
    /** The stable id. */
    readonly id: string
    /** The criterion text. */
    readonly criterion: string
    /** The most points. */
    readonly maxScore: number
}

/** An option as the learner sees it before a submit: no correctness, no explanation. */
export interface LessonOptionView {
    /** The stable id. */
    readonly id: string
    /** The option text. */
    readonly label: string
}

/** A simulation as the learner plays it. */
export interface LessonSimulationView {
    /** The state to start in. */
    readonly initialStateId: string
    /** The question asked at the goal. */
    readonly debriefQuestion: string
    /** Every state. */
    readonly states: ReadonlyArray<LessonSimulationState>
    /** Every action. */
    readonly actions: ReadonlyArray<LessonSimulationAction>
    /** Every edge. */
    readonly transitions: ReadonlyArray<LessonSimulationTransition>
}

/** An exercise as the learner receives it. */
export interface LessonExerciseView {
    /** What to submit. */
    readonly submissionInstructions: string
    /** The files handed over. */
    readonly files: ReadonlyArray<LessonExerciseFile>
}

/** An activity as the learner sees it before a submit. */
export interface LessonActivityView {
    /** The stable id. */
    readonly id: string
    /** What the activity asks. */
    readonly kind: LessonActivityKind
    /** The question. */
    readonly prompt: string
    /** The shape of the answer, or null. */
    readonly responseKind: string | null
    /** `deterministic`, `ai-rubric`, or null. */
    readonly evaluationMethod: string | null
    /** Whether the activity is a diagnostic. */
    readonly isDiagnostic: boolean
    /** The outcomes the activity trains. */
    readonly outcomeIds: ReadonlyArray<string>
    /** The criteria names, empty without a rubric. */
    readonly criteria: ReadonlyArray<LessonCriterionView>
    /** The options, empty for a non-choice. */
    readonly options: ReadonlyArray<LessonOptionView>
    /** The simulation, or null. */
    readonly simulation: LessonSimulationView | null
    /** The exercise, or null. */
    readonly exercise: LessonExerciseView | null
}

/** A section as the learner sees it; a locked one keeps its title and drops the content. */
export interface LessonSectionView {
    /** The folder name. */
    readonly id: string
    /** The position. */
    readonly sortIndex: number
    /** The phase. */
    readonly phase: LessonPhase
    /** The title. */
    readonly title: string
    /** True when Premium is needed to read the section. */
    readonly locked: boolean
    /** The markdown body, or null when locked. */
    readonly body: string | null
    /** The activities, empty when locked. */
    readonly activities: ReadonlyArray<LessonActivityView>
}

/** The test commands as the learner receives them; a platform without one is null. */
export interface LessonCommandsView {
    /** The Windows command, or null. */
    readonly windows: string | null
    /** The Unix command, or null. */
    readonly unix: string | null
}

/** The workspace a premium learner receives for the lab. */
export interface LessonWorkspaceView {
    /** The runtime. */
    readonly runtime: string
    /** The test commands. */
    readonly commands: LessonCommandsView
    /** The files with their text. */
    readonly files: ReadonlyArray<LessonWorkspaceFile>
}

/** A reference as the learner sees it. */
export interface LessonReferenceView {
    /** The stable id. */
    readonly id: string
    /** The short name. */
    readonly label: string
    /** The address, or null. */
    readonly url: string | null
    /** The citation. */
    readonly citation: string
}

/** The public projection of one lesson version in one locale. */
export interface LessonView {
    /** The lesson id. */
    readonly id: string
    /** The version served. */
    readonly version: string
    /** The locale of the text. */
    readonly locale: LessonLocale
    /** The title. */
    readonly title: string
    /** The description. */
    readonly description: string
    /** The category. */
    readonly category: string
    /** The catalog group. */
    readonly group: string
    /** The topic. */
    readonly topic: LessonTopicRef
    /** The difficulty. */
    readonly difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    readonly minutes: number
    /** The implementation language, or `agnostic`. */
    readonly implementation: string
    /** The overview markdown. */
    readonly overview: string
    /** The outcomes. */
    readonly learningOutcomes: ReadonlyArray<LessonStatement>
    /** The prerequisites. */
    readonly prerequisites: ReadonlyArray<LessonStatement>
    /** The references. */
    readonly references: ReadonlyArray<LessonReferenceView>
    /** Whether the learner holds Premium. */
    readonly isPremium: boolean
    /** The sections in order. */
    readonly sections: ReadonlyArray<LessonSectionView>
    /** The workspace, or null without Premium or without a workspace. */
    readonly workspace: LessonWorkspaceView | null
}

/** A lesson to read: its id and the locale of the text. */
export interface LessonLookupParams {
    /** The lesson id. */
    readonly id: string
    /** The locale of the text. */
    readonly locale: LessonLocale
    /** The learner who reads. */
    readonly learnerId: string
}

/** The stored activity the grading side asks for, in one locale, with its answers and rubric. */
export interface LessonActivityParams {
    /** The lesson id. */
    readonly lessonId: string
    /** The version the learner studies. */
    readonly version: string
    /** The activity id. */
    readonly activityId: string
    /** The locale of the learner's text. */
    readonly locale: LessonLocale
}

/** The server activity with the section it sits in. */
export interface LessonServerActivity {
    /** The whole activity, with answers, rubric and options' correctness. */
    readonly activity: LessonActivity
    /** The phase of its section, or `retrieval` for a review activity. */
    readonly phase: LessonPhase | "retrieval"
}

/** The learner and the phase of the content they ask to study; `retrieval` is a review activity. */
export interface LessonAccessParams {
    /** The learner who asks. */
    readonly learnerId: string
    /** The phase of the content. */
    readonly phase: LessonPhase | "retrieval"
}

/** One retrieval activity a lesson schedules after completion. */
export interface LessonRetrievalPlan {
    /** The retrieval activity. */
    readonly activityId: string
    /** The days after completion it is asked again. */
    readonly afterDays: number
}

/** What completing a lesson version means and schedules: the activities to grade and the retrieval items to ask later. */
export interface LessonPlan {
    /** The activities a learner must have graded: every activity of the sections that is not a diagnostic. */
    readonly required: ReadonlyArray<string>
    /** The retrieval activities with their authored days. */
    readonly retrieval: ReadonlyArray<LessonRetrievalPlan>
}
