import type {
    LessonArchitecture,
    LessonChallengeLevel,
    LessonCodeWalkEntry,
    LessonInvariant,
    LessonPatternStatus,
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
    /** The development of the opener story this question adds, or null (a lesson without a story, a challenge question). */
    readonly event: LessonOpenerEventView | null
    /** A few words naming the moment, the heading of the question; null when it ships none. */
    readonly title: string | null
    /** What is seen going wrong, the last sentence of the scene; null when it ships none. */
    readonly symptom: string | null
    /** What the interviewer wants to know; null when it ships none. */
    readonly probe: string | null
    /** The system the question touches, as a Mermaid flowchart (not drawn by the opener); null when it ships none. */
    readonly contextDiagram: string | null
    /** The one line that says which parts the flowchart touches (not drawn by the opener); null when it ships none. */
    readonly contextCaption: string | null
    /** Chuyện gì xảy ra: the scene in plain business words, as prose paragraphs. */
    readonly steps: ReadonlyArray<string>
    /** The condition the right option must meet (not drawn by the opener); null when it ships none. */
    readonly condition: string | null
    /** The code and table names, the first line inside Xem kỹ thuật; null when it ships none. */
    readonly technical: string | null
    /** The activity id of the written explanation the question asks (`challenge.<id>.<question>.written`), or null. */
    readonly writtenActivityId: string | null
}

/** One development of the opener story as the timeline shows it. */
export interface LessonOpenerEventView {
    /** When it happens (`21:03`). */
    readonly at: string
    /** What happens. */
    readonly text: string
}

/** The situation the opener tells, shown above the questions. */
export interface LessonOpenerStoryView {
    /** The situation in a few words. */
    readonly title: string
    /** Bối cảnh: the situation, paragraphs split by a blank line. */
    readonly body: string
    /** The opening hook, the lede under the title; null when the story ships none. */
    readonly hook: string | null
    /** The closing after the last question (Hết đêm); null when the story ships none. */
    readonly closing: { readonly body: string; readonly question: string } | null
    /** The business line; empty when the story names none. */
    readonly company: string
    /** The key figures of the situation. */
    readonly facts: ReadonlyArray<string>
    /** The whole system, drawn once at the top of Mở đầu; null when the lesson ships none. */
    readonly system: { readonly diagram: string; readonly caption: string } | null
    /** The lesson's glossary. */
    readonly glossary: ReadonlyArray<{ readonly term: string; readonly definition: string }>
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
    /** True when some essence question of the tier asks a written explanation (AI graded), from the Khó tier up. */
    readonly writtenRequired: boolean
}

/**
 * One test of the Tìm sạn bug pack as every reader of the part sees it: what it checks and how to run it. "Vì sao giờ đúng", "Vì sao
 * chưa pass" and the hints are not here: the learner's own runs release them (`lessonBugRuns`).
 */
export interface LessonBugTestView {
    /** The test id. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The opener question id it belongs to, or null. */
    readonly essence: string | null
    /** The command the CLI runs for it. */
    readonly command: string
    /** What a correct system shows. */
    readonly expected: string
    /** The label of what the run measures. */
    readonly received: string
    /** How many hints it has. */
    readonly hintCount: number
    /** True for the final test, which opens once every other test passed. */
    readonly isFinal: boolean
}

/** The bug pack of Tìm sạn as the page reads it. */
export interface LessonBugPackView {
    /** The tests, in order. */
    readonly tests: ReadonlyArray<LessonBugTestView>
}

/** One Pattern stack as the page reads it. */
export interface LessonPatternView {
    /** The stack id. */
    readonly stack: string
    /** Ready or soon. */
    readonly status: LessonPatternStatus
    /** The GitHub repository, `owner/name`, or empty. */
    readonly repo: string
    /** The folder inside it, or empty. */
    readonly path: string
    /** The link to the folder on GitHub, or null for a stack without a repository. */
    readonly url: string | null
    /** Đặt code ở đâu. */
    readonly where: string
    /** Áp tới mức nào. */
    readonly howFar: string
    /** Server sập thì sao. */
    readonly whenDown: string
    /** The main files with what each holds. */
    readonly files: ReadonlyArray<{ readonly path: string; readonly note: string }>
    /** The snippet, or null. */
    readonly snippet: { readonly lang: string; readonly file: string; readonly code: string } | null
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
    /** The situation the opener tells, or null for a lesson without one (or when the opener part is locked). */
    readonly story: LessonOpenerStoryView | null
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
    /** The bug pack of Tìm sạn, or null (a lesson without one, or the part is locked). */
    readonly bugs: LessonBugPackView | null
    /** The Pattern stacks; empty for a lesson without them or when the part is locked. */
    readonly patterns: ReadonlyArray<LessonPatternView>
    /** The Bản chất reading's glossary and self-checks, or null (a lesson without them, or the part is locked). */
    readonly reading: LessonReadingView | null
}

/** One glossary term of the reading. */
export interface LessonReadingTermView {
    readonly id: string
    readonly term: string
    readonly definition: string
}

/** One self-check of the reading before a pick: the question and the choice words, never the key or a reason. */
export interface LessonReadingCheckView extends LessonQuestionView {
    /** The `## N.` chapter it closes. */
    readonly chapter: string
}

/** The glossary and self-checks of the Bản chất reading. */
export interface LessonReadingView {
    readonly glossary: ReadonlyArray<LessonReadingTermView>
    readonly checks: ReadonlyArray<LessonReadingCheckView>
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
    /** The hint shown when the run is red, or null. The lesson door sends it only after the learner's red run or their own ask. */
    readonly hint: string | null
    /** True while the scenario has a hint the learner has not unlocked (no red run yet and not asked for): the text is withheld. */
    readonly isHintLocked: boolean
}
