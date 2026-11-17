import type {
    LessonArchitecture,
    LessonChallengeLevel,
    LessonCodeWalkEntry,
    LessonInvariant,
    LessonScenario,
    LessonSourceLanguage,
} from "./lesson-essential.contracts"

/** A choice as the learner sees it before a submit: the words only. */
export interface LessonChoiceView {
    /** The option id a submit names (`c0`, `c1`…). */
    readonly id: string
    /** The choice text. */
    readonly label: string
}

/** A question as the learner sees it before a submit: no right index, no explanation. */
export interface LessonQuestionView {
    /** The question id. */
    readonly id: string
    /** The activity id a submit names (`opener.<id>`, `challenge.<challenge>.<id>`). */
    readonly activityId: string
    /** The question. */
    readonly prompt: string
    /** The choices. */
    readonly choices: ReadonlyArray<LessonChoiceView>
    /** The article section to read closely when wrong, or null. */
    readonly sectionId: string | null
    /** The heading number inside it (`2.2`), or null. */
    readonly sectionRef: string | null
    /** The scenario that shows the answer, or null. */
    readonly scenarioId: string | null
}

/** The source repository as the learner sees it. */
export interface LessonSourceView {
    /** The languages it ships. */
    readonly langs: ReadonlyArray<LessonSourceLanguage>
    /** The ref, or null. */
    readonly ref: string | null
}

/** A rubric criterion as the learner sees it: the words and the points. */
export interface LessonChallengeCriterionView {
    /** The criterion id. */
    readonly id: string
    /** The criterion. */
    readonly criterion: string
    /** Its points. */
    readonly points: number
    /** Whether it is the critical one. */
    readonly isCritical: boolean
}

/** One rung of the ladder as the learner sees it; the hidden scenarios are counted, never named. */
export interface LessonChallengeView {
    /** The challenge id. */
    readonly id: string
    /** The rung. */
    readonly level: LessonChallengeLevel
    /** The title. */
    readonly title: string
    /** The brief, markdown. */
    readonly brief: string
    /** The rubric. */
    readonly rubric: ReadonlyArray<LessonChallengeCriterionView>
    /** How many hidden scenarios judge it. */
    readonly hiddenScenarios: number
    /** The essence check. */
    readonly questions: ReadonlyArray<LessonQuestionView>
}

/**
 * The four parts of a lesson as the learner sees them. A part the entitlement setting does not leave free (by default Source,
 * Kịch bản and Tự áp dụng) is empty without Premium; its payload is never sent, only its id in `lockedParts`.
 */
export interface LessonEssentialView {
    /** True when at least one part is locked for the learner. */
    readonly isLocked: boolean
    /** The ids of the parts the learner may not read (`1-essential`, `2-source`, `3-scenarios`, `4-apply`), in order. */
    readonly lockedParts: ReadonlyArray<string>
    /** The five-question opener. */
    readonly opener: ReadonlyArray<LessonQuestionView>
    /** The source repository, or null. */
    readonly source: LessonSourceView | null
    /** The invariants. */
    readonly invariants: ReadonlyArray<LessonInvariant>
    /** How many invariants only the hidden challenge scenarios judge; they are counted, never named. */
    readonly hiddenInvariants: number
    /** The architecture, or null. */
    readonly architecture: LessonArchitectureView | null
    /** The code walk. */
    readonly codeWalk: ReadonlyArray<LessonCodeWalkView>
    /** The scenarios. */
    readonly scenarios: ReadonlyArray<LessonScenarioView>
    /** The challenge ladder. */
    readonly challenges: ReadonlyArray<LessonChallengeView>
}

/** A component as the learner sees it. */
export interface LessonArchitectureComponentView {
    /** The component. */
    readonly name: string
    /** Its port, or null. */
    readonly port: string | null
    /** What it does, or null. */
    readonly role: string | null
    /** The invariant ids it keeps. */
    readonly invariants: ReadonlyArray<string>
}

/** The architecture as the learner sees it. */
export interface LessonArchitectureView extends Pick<LessonArchitecture, "diagram"> {
    /** The components. */
    readonly components: ReadonlyArray<LessonArchitectureComponentView>
}

/** A code-walk entry as the learner sees it. */
export interface LessonCodeWalkView extends Omit<LessonCodeWalkEntry, "why"> {
    /** Why, or null. */
    readonly why: string | null
}

/** A scenario as the learner sees it: the guards by name, the run details stay in the signed manifest. */
export interface LessonScenarioView extends Pick<
    LessonScenario,
    "id" | "title" | "fault" | "command" | "expected" | "invariant"
> {
    /** The guard names the learner may switch off. */
    readonly guards: ReadonlyArray<string>
    /** The hint shown when the run is red, or null. */
    readonly hint: string | null
}
