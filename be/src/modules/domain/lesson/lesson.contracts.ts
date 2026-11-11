/** The locales a lesson is written in; both are required. */
export type LessonLocale = "vi" | "en"

/** The locales every lesson is written in, in the order the stored document lists them. */
export const LESSON_LOCALES: ReadonlyArray<LessonLocale> = ["vi", "en"]

/** The six phases of a lesson, in the order a learner meets them. */
export type LessonPhase = "challenge" | "predict" | "explore" | "explain" | "apply" | "reflect"

/** The one phase every signed-in learner may study; every other phase needs Premium. */
export const LESSON_FREE_PHASE: LessonPhase = "challenge"

/** How hard a lesson is. */
export type LessonDifficulty = "foundation" | "intermediate" | "advanced"

/** What an activity asks of the learner. */
export type LessonActivityKind = "explain" | "choice" | "simulation" | "exercise" | "retrieval"

/** An outcome or a prerequisite: a stable id and its text. */
export interface LessonStatement {
    /** The stable id the activities point at. */
    readonly id: string
    /** The text in one locale. */
    readonly text: string
}

/** A source the lesson cites. */
export interface LessonReference {
    /** The stable id of the reference. */
    readonly id: string
    /** The short name shown to the learner. */
    readonly label: string
    /** The address, when the source has one. */
    readonly url?: string
    /** The citation, with its check date or V1 git sha. */
    readonly citation: string
}

/** One grading criterion of an activity; the expected evidence is for the grader only. */
export interface LessonCriterion {
    /** The stable id. */
    readonly id: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** What a good answer shows; never leaves the server. */
    readonly expectedEvidence: string
    /** The misconception the criterion catches; never leaves the server. */
    readonly misconception: string
    /** The most points the criterion gives. */
    readonly maxScore: number
}

/** One option of a choice activity. */
export interface LessonOption {
    /** The stable id. */
    readonly id: string
    /** The option as the learner reads it. */
    readonly label: string
    /** Why the option is right or wrong; released after the learner submits. */
    readonly explanation: string
    /** Whether the option is the right one; never leaves the server before a submit. */
    readonly isCorrect: boolean
}

/** The teacher's answer to an activity; never leaves the server before a submit. */
export interface LessonAnswer {
    /** The explanation of the right answer. */
    readonly explanation: string
    /** A model answer, for written activities. */
    readonly sampleAnswer?: string
    /** The misconceptions the answer corrects. */
    readonly misconception?: string
}

/** A counter or reading shown with a simulation state, such as "Charges: 2". */
export interface LessonSimulationFact {
    /** What is measured. */
    readonly label: string
    /** Its value in this state. */
    readonly value: string
}

/** One state of a simulation. */
export interface LessonSimulationState {
    /** The facts shown with the state. */
    readonly facts?: ReadonlyArray<LessonSimulationFact>
    /** The stable id. */
    readonly id: string
    /** The short name of the state. */
    readonly label: string
    /** What the learner observes in the state. */
    readonly observation: string
    /** Whether the state is a goal. */
    readonly isSuccess: boolean
}

/** One action the learner may take in a simulation. */
export interface LessonSimulationAction {
    /** True when the action opens a branch worth trying; the learner is shown how many branches were tried. */
    readonly isBranch?: boolean
    /** The stable id. */
    readonly id: string
    /** The action as the learner reads it. */
    readonly label: string
}

/** One edge of a simulation: taking an action in a state leads to another state. */
export interface LessonSimulationTransition {
    /** The stable id. */
    readonly id: string
    /** The state the action is taken in. */
    readonly fromStateId: string
    /** The action taken. */
    readonly actionId: string
    /** The state it leads to. */
    readonly toStateId: string
}

/** The state machine of a simulation activity. */
export interface LessonSimulation {
    /** The engine name; only the state machine exists. */
    readonly engine: string
    /** The state the learner starts in. */
    readonly initialStateId: string
    /** The question asked after the learner reaches a goal. */
    readonly debriefQuestion: string
    /** Every state. */
    readonly states: ReadonlyArray<LessonSimulationState>
    /** Every action. */
    readonly actions: ReadonlyArray<LessonSimulationAction>
    /** Every edge. */
    readonly transitions: ReadonlyArray<LessonSimulationTransition>
}

/** A file an exercise hands the learner. */
export interface LessonExerciseFile {
    /** The path inside the exercise. */
    readonly relativePath: string
    /** The role of the file (`reference`, `checks`). */
    readonly role: string
    /** The language the editor highlights. */
    readonly syntaxLanguage: string
    /** The file text. */
    readonly content: string
}

/** The exercise part of an activity. */
export interface LessonExercise {
    /** What the learner submits. */
    readonly submissionInstructions: string
    /** How the submission is verified. */
    readonly verificationMode: string
    /** The files the exercise hands over. */
    readonly files?: ReadonlyArray<LessonExerciseFile>
}

/** One activity as the server stores it, whole, with its rubric and answers. */
export interface LessonActivity {
    /** The stable id, unique inside the lesson. */
    readonly id: string
    /** What the activity asks. */
    readonly kind: LessonActivityKind
    /** The question as the learner reads it. */
    readonly prompt: string
    /** The authoring key. */
    readonly stableKey?: string
    /** The shape of the answer (`written-explanation`, `single-choice`). */
    readonly responseKind?: string
    /** `deterministic` or `ai-rubric`. */
    readonly evaluationMethod?: string
    /** Whether the activity is a diagnostic that does not count toward passing. */
    readonly isDiagnostic?: boolean
    /** When the feedback is released. */
    readonly feedbackRelease?: string
    /** The learning outcomes the activity trains. */
    readonly outcomeIds: ReadonlyArray<string>
    /** For a retrieval activity, the days after completion it is asked again. */
    readonly afterDays?: number
    /** The hints, later released by level. */
    readonly hints?: ReadonlyArray<string>
    /** The grading criteria. */
    readonly rubric?: ReadonlyArray<LessonCriterion>
    /** The teacher's answer. */
    readonly answer?: LessonAnswer
    /** The options of a choice. */
    readonly options?: ReadonlyArray<LessonOption>
    /** The state machine of a simulation. */
    readonly simulation?: LessonSimulation
    /** The exercise of an exercise activity. */
    readonly exercise?: LessonExercise
}

/** The workspace file list a concept declares. */
export interface LessonWorkspaceDeclaration {
    /** The runtime the commands need. */
    readonly runtime: string
    /** The declared files. */
    readonly files: ReadonlyArray<LessonWorkspaceEntry>
    /** The commands that run the tests. */
    readonly commands: LessonWorkspaceCommands
}

/** The languages a workspace ships in. */
export const LESSON_WORKSPACE_LANGUAGES = ["typescript", "java", "csharp", "go"] as const

/** One language of a workspace. */
export type LessonWorkspaceLanguage = (typeof LESSON_WORKSPACE_LANGUAGES)[number]

/** The workspace of one language as the root file declares it. */
export interface LessonWorkspaceVariantDeclaration extends LessonWorkspaceDeclaration {
    /** The language id. */
    readonly language: LessonWorkspaceLanguage
}

/** One declared workspace file. */
export interface LessonWorkspaceEntry {
    /** The path relative to the lesson folder. */
    readonly path: string
    /** `source` or `test`. */
    readonly role: string
}

/** The test commands per platform. */
export interface LessonWorkspaceCommands {
    /** The Windows command. */
    readonly windows?: string
    /** The Unix command. */
    readonly unix?: string
}

/** A workspace file with its text. */
export interface LessonWorkspaceFile extends LessonWorkspaceEntry {
    /** The file text. */
    readonly content: string
}

/** The workspace of one language with the text of its files. */
export interface LessonWorkspaceVariant extends LessonWorkspaceVariantDeclaration {
    /** The files with their text. */
    readonly files: ReadonlyArray<LessonWorkspaceFile>
}

/** The fields of a section file (`sections/<id>/<locale>.md`) once decoded. */
export interface LessonSectionFile {
    /** The section title. */
    readonly title: string
    /** The phase the section belongs to. */
    readonly phase: LessonPhase
    /** The position among the sections. */
    readonly sortIndex: number
    /** The markdown body. */
    readonly body: string
    /** The teacher's mark: `false` makes the section free, `true` makes it Premium; absent leaves it to the lesson mark and the default. */
    readonly isPremium?: boolean
    /** The activities of the section. */
    readonly activities?: ReadonlyArray<LessonActivity>
}

/** A section as stored: its file fields and its folder id. */
export interface LessonSection extends LessonSectionFile {
    /** The folder name of the section. */
    readonly id: string
}

/** The fields of the root file (`<locale>.md`) once decoded. */
export interface LessonRootFile {
    /** The title. */
    readonly title: string
    /** The one-sentence description. */
    readonly description: string
    /** The category. */
    readonly category: string
    /** The difficulty. */
    readonly difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    readonly minutesRead: number
    /** The implementation language, or `agnostic`. */
    readonly implementation: string
    /** The position in the catalog. */
    readonly sortIndex: number
    /** The overview markdown. */
    readonly body: string
    /** The teacher's mark for every section of the lesson that carries none of its own; absent leaves it to the default. */
    readonly isPremium?: boolean
    /** What the learner can do after the lesson. */
    readonly learningOutcomes: ReadonlyArray<LessonStatement>
    /** What the learner should know before. */
    readonly prerequisites: ReadonlyArray<LessonStatement>
    /** The sources cited. */
    readonly references: ReadonlyArray<LessonReference>
    /** The retrieval activities scheduled after completion. */
    readonly activities?: ReadonlyArray<LessonActivity>
    /** The workspace declaration. */
    readonly workspace?: LessonWorkspaceDeclaration
    /** The workspace in each language the lesson ships, when it ships more than one. */
    readonly workspaces?: ReadonlyArray<LessonWorkspaceVariantDeclaration>
}

/** One locale of a lesson as stored. */
export interface LessonLocaleDocument {
    /** The title. */
    readonly title: string
    /** The description. */
    readonly description: string
    /** The overview markdown. */
    readonly body: string
    /** The teacher's mark for the sections that carry none of their own; absent when the content carries none. */
    readonly isPremium?: boolean
    /** The outcomes. */
    readonly learningOutcomes: ReadonlyArray<LessonStatement>
    /** The prerequisites. */
    readonly prerequisites: ReadonlyArray<LessonStatement>
    /** The references. */
    readonly references: ReadonlyArray<LessonReference>
    /** The retrieval activities. */
    readonly retrieval: ReadonlyArray<LessonActivity>
    /** The sections in order. */
    readonly sections: ReadonlyArray<LessonSection>
}

/** The whole content of a lesson version as stored: every locale, whole, plus the workspace. */
export interface LessonContent {
    /** The documents by locale. */
    readonly locales: Readonly<Record<LessonLocale, LessonLocaleDocument>>
    /** The workspace declaration, or null for a concept without one. */
    readonly workspace: LessonWorkspaceDeclaration | null
    /** The workspace files with their text. */
    readonly files: ReadonlyArray<LessonWorkspaceFile>
    /** The workspace per language; absent in a version stored before the languages existed. */
    readonly workspaces?: ReadonlyArray<LessonWorkspaceVariant>
}
