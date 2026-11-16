/**
 * The four-part lesson (Bản chất, Source, Kịch bản, Tự áp dụng): optional fields of the root file that a lesson written before
 * them simply lacks. Every field is added, none renamed or removed, so the format stays a superset of what the importer read.
 */

/** The languages a lesson's source repository ships; lessons are TypeScript only (owner 2026-11-17). */
export const LESSON_SOURCE_LANGUAGES = ["typescript"] as const

/** One language of a lesson's source repository. */
export type LessonSourceLanguage = (typeof LESSON_SOURCE_LANGUAGES)[number]

/** The rungs of the challenge ladder, easiest first. */
export const LESSON_CHALLENGE_LEVELS = ["easy", "medium", "hard", "insane"] as const

/** One rung of the challenge ladder. */
export type LessonChallengeLevel = (typeof LESSON_CHALLENGE_LEVELS)[number]

/** One multiple-choice interview question: the opener asks five, a challenge's essence check asks its own. */
export interface LessonOpenerQuestion {
    /** The stable id, unique inside the lesson. */
    readonly id: string
    /** The question as the learner reads it. */
    readonly prompt: string
    /** The choices in the order shown. */
    readonly choices: ReadonlyArray<string>
    /** The index of the right choice; never leaves the server before a submit. */
    readonly correctIndex: number
    /** Why the right choice is right; released after the submit. */
    readonly explanation: string
    /** The article section to read closely when the answer is wrong. */
    readonly sectionId?: string
    /** The scenario that shows the answer when it is run. */
    readonly scenarioId?: string
}

/** The source repository the learner pulls and runs. */
export interface LessonSourceRepo {
    /** The repository, `owner/name`. */
    readonly repo: string
    /** The languages it ships. */
    readonly langs: ReadonlyArray<LessonSourceLanguage>
    /** The branch, tag or sha the lesson was written against. */
    readonly ref?: string
}

/** One rule the system keeps, which the code walk, the components and the scenarios point at (`C1`, atomic per wallet). */
export interface LessonInvariant {
    /** The stable id (`C1`). */
    readonly id: string
    /** The rule in one line. */
    readonly text: string
}

/** One component of the architecture with the rules it keeps. */
export interface LessonArchitectureComponent {
    /** The component (`wallet-service`). */
    readonly name: string
    /** The port it listens on, when it has one. */
    readonly port?: string
    /** What it does, in a few words. */
    readonly role?: string
    /** The invariant ids it keeps. */
    readonly invariants: ReadonlyArray<string>
}

/** The architecture of the source repository. */
export interface LessonArchitecture {
    /** The diagram, in mermaid. */
    readonly diagram: string
    /** The components with the rules each keeps. */
    readonly components: ReadonlyArray<LessonArchitectureComponent>
}

/** One entry of the code walk: where an invariant lives in the repository, as a snippet equal to the file. */
export interface LessonCodeWalkEntry {
    /** The stable id. */
    readonly id: string
    /** The heading. */
    readonly title: string
    /** The invariant id the snippet keeps. */
    readonly invariant: string
    /** The file, relative to the repository root. */
    readonly file: string
    /** The first line of the snippet in the file. */
    readonly line: number
    /** The snippet, byte for byte the lines of the file. */
    readonly snippet: string
    /** Why the code is written so: what breaks without it. */
    readonly why?: string
}

/** One scenario: a fault the learner runs through the learner CLI and the result the relay brings back. */
export interface LessonScenario {
    /** The stable id the CLI and the relay name (`crash-after-debit`). */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The fault it injects, in words. */
    readonly fault: string
    /** The command the learner runs. */
    readonly command: string
    /** The output a correct system shows. */
    readonly expected: string
    /** The invariant id the scenario judges. */
    readonly invariant: string
    /** The guards the learner may switch off (`--guard <name>=off`) to see the fault land. */
    readonly guards: ReadonlyArray<string>
    /** The hint shown when the run is red. */
    readonly hint?: string
}

/** One criterion of a challenge rubric, worth some of its 100 points. */
export interface LessonChallengeCriterion {
    /** The stable id. */
    readonly id: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** The points it is worth. */
    readonly points: number
    /** True for the one critical criterion of a challenge. */
    readonly isCritical?: boolean
}

/** One rung of the challenge ladder: built with the learner's AI, judged by hidden scenarios and an essence check. */
export interface LessonChallenge {
    /** The stable id. */
    readonly id: string
    /** The rung. */
    readonly level: LessonChallengeLevel
    /** The title. */
    readonly title: string
    /** What to build, in markdown. */
    readonly brief: string
    /** The rubric; its points add up to 100. */
    readonly rubric: ReadonlyArray<LessonChallengeCriterion>
    /** How many hidden scenarios judge it; their ids never leave the server. */
    readonly hiddenScenarios?: number
    /** The essence check: multiple-choice and design-decision questions graded on the spot. */
    readonly questions?: ReadonlyArray<LessonOpenerQuestion>
}

/** The four-part fields of one locale; a lesson written before them has none. */
export interface LessonEssential {
    /** The five-question opener. */
    readonly opener: ReadonlyArray<LessonOpenerQuestion>
    /** The source repository, or null. */
    readonly source: LessonSourceRepo | null
    /** The invariants. */
    readonly invariants: ReadonlyArray<LessonInvariant>
    /** The architecture, or null. */
    readonly architecture: LessonArchitecture | null
    /** The code walk. */
    readonly codeWalk: ReadonlyArray<LessonCodeWalkEntry>
    /** The scenarios. */
    readonly scenarios: ReadonlyArray<LessonScenario>
    /** The challenge ladder. */
    readonly challenges: ReadonlyArray<LessonChallenge>
}

/** The four-part fields as the root file may carry them, each optional. */
export interface LessonEssentialFields {
    /** The five-question opener. */
    readonly opener?: ReadonlyArray<LessonOpenerQuestion>
    /** The source repository. */
    readonly source?: LessonSourceRepo
    /** The invariants. */
    readonly invariants?: ReadonlyArray<LessonInvariant>
    /** The architecture. */
    readonly architecture?: LessonArchitecture
    /** The code walk. */
    readonly codeWalk?: ReadonlyArray<LessonCodeWalkEntry>
    /** The scenarios. */
    readonly scenarios?: ReadonlyArray<LessonScenario>
    /** The challenge ladder. */
    readonly challenges?: ReadonlyArray<LessonChallenge>
}

/** The activity id an opener question is submitted under: `opener.<question id>`. */
export const openerActivityId = (questionId: string): string => `opener.${questionId}`

/** The activity id a challenge question is submitted under: `challenge.<challenge id>.<question id>`. */
export const challengeActivityId = (challengeId: string, questionId: string): string =>
    `challenge.${challengeId}.${questionId}`

/** The option id of a choice: `c<index>`. */
export const choiceOptionId = (index: number): string => `c${index}`

/** The relay task a lesson's scenarios run under: `lesson:<lesson id>`; the check id is the scenario id. */
export const lessonRelayTaskId = (lessonId: string): string => `lesson:${lessonId}`
