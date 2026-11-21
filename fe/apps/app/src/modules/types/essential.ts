/** The rungs of the challenge ladder, easiest first. */
export const CHALLENGE_LEVELS = ["easy", "medium", "hard", "insane"] as const

/** One rung of the challenge ladder. */
export type ChallengeLevel = (typeof CHALLENGE_LEVELS)[number]

/**
 * The five parts of a lesson page, in the order a learner meets them (`?part=`): Mở đầu (`essence`, the opener), Bản chất
 * (`source`, the practice-led reading), Tìm sạn (`scenarios`, the bug pack), Challenges (`apply`) and Pattern (`pattern`). The ids
 * stay the earlier ones so links into a part keep working.
 */
export const ESSENTIAL_PARTS = ["essence", "source", "scenarios", "apply", "pattern"] as const

/** One part of a lesson page (`?part=`). */
export type EssentialPart = (typeof ESSENTIAL_PARTS)[number]

/** A multiple-choice question before a submit: the choices only, never the right one or the explanation. */
export type EssentialQuestionView = {
    readonly id: string
    /** The activity id the attempt is submitted under (`opener.<id>`, `challenge.<challenge>.<id>`). */
    readonly activityId: string
    readonly prompt: string
    readonly choices: ReadonlyArray<{ readonly id: string; readonly label: string }>
    /** The article section to read closely when the answer is wrong; empty when none. */
    readonly sectionId: string
    /** The heading number to read closely inside it (`2.2`); empty when none. */
    readonly sectionRef: string
    /** The scenario that shows the answer; empty when none. */
    readonly scenarioId: string
    /** The development of the opener story this question adds; undefined for a lesson without a story and a challenge question. */
    readonly event: OpenerEventView | undefined
    /** The activity id of the written explanation the question asks; empty when it asks none. */
    readonly writtenActivityId: string
}

/** One development of the opener story: when it happens (`21:03`) and what happens. */
export type OpenerEventView = { readonly at: string; readonly text: string }

/** The one real-world situation the opener tells; the five questions are five developments of it. */
export type OpenerStoryView = { readonly title: string; readonly body: string }

/** The three-part explanation a right opener pick releases: Bản chất, Vì sao cần, Trả lời phỏng vấn. */
export type OpenerInsightView = { readonly essence: string; readonly why: string; readonly interview: string }

/** One scenario of Kịch bản. */
export type EssentialScenarioView = {
    readonly id: string
    readonly title: string
    readonly fault: string
    readonly expected: string
    readonly invariant: string
    readonly guards: ReadonlyArray<string>
    readonly hint: string
    /** True while the back end keeps the hint back (it opens after the first red run or on request). */
    readonly isHintLocked: boolean
}

/** One rung of the challenge ladder. */
export type EssentialChallengeView = {
    readonly id: string
    readonly level: ChallengeLevel
    readonly title: string
    readonly brief: string
    readonly rubric: ReadonlyArray<{
        readonly id: string
        readonly criterion: string
        readonly points: number
        readonly isCritical: boolean
    }>
    readonly hiddenScenarios: number
    readonly questions: ReadonlyArray<EssentialQuestionView>
    /** True when some essence question of the rung asks a written explanation (AI graded). */
    readonly writtenRequired: boolean
}

/** One test of the Tìm sạn bug pack as the lesson names it: what it checks and how to run it. */
export type BugTestView = {
    readonly id: string
    readonly title: string
    /** The opener question id it belongs to; empty for the happy path and the final test. */
    readonly essence: string
    readonly command: string
    readonly expected: string
    /** The label of what the run measures. */
    readonly received: string
    readonly hintCount: number
    readonly isFinal: boolean
}

/** Where a Tìm sạn test stands for the learner. */
export type BugRunStatus = "none" | "running" | "passed" | "failed"

/** One Tìm sạn test with the learner's newest run and what it earned (the back end releases each text only once earned). */
export type BugResultView = {
    readonly testId: string
    readonly status: BugRunStatus
    readonly isLocked: boolean
    readonly at: string
    /** What the newest red run measured; empty otherwise. */
    readonly received: string
    readonly output: string
    /** "Vì sao giờ đúng", after a green run; empty otherwise. */
    readonly pass: string
    /** "Vì sao chưa pass", after a red run; empty otherwise. */
    readonly fail: string
    /** The hints opened so far, while the test is red. */
    readonly hints: ReadonlyArray<string>
    readonly hintsOpened: number
    readonly hintCount: number
}

/** One Pattern stack: where a real project keeps the pattern. */
export type PatternView = {
    readonly stack: string
    readonly status: "ready" | "soon"
    readonly repo: string
    readonly path: string
    /** The folder on GitHub; empty for a stack without a repository. */
    readonly url: string
    readonly where: string
    readonly howFar: string
    readonly whenDown: string
    readonly files: ReadonlyArray<{ readonly path: string; readonly note: string }>
    readonly snippet: { readonly lang: string; readonly file: string; readonly code: string } | undefined
}

/** The four parts of a lesson as the page reads them; a part the learner may not read is empty and named in `lockedParts`. */
export type EssentialView = {
    /** True when at least one part is locked for the learner. */
    readonly isLocked: boolean
    /** The parts the learner may not read (by default Source, Kịch bản and Tự áp dụng without Premium); never their payload. */
    readonly lockedParts: ReadonlyArray<EssentialPart>
    /** The situation the opener tells; undefined for a lesson written before the story. */
    readonly story: OpenerStoryView | undefined
    readonly opener: ReadonlyArray<EssentialQuestionView>
    /** The source as the CLI pulls it; undefined when the lesson ships none yet. */
    readonly source:
        | {
              readonly langs: ReadonlyArray<string>
          }
        | undefined
    readonly invariants: ReadonlyArray<{ readonly id: string; readonly text: string }>
    readonly architecture:
        | {
              readonly diagram: string
              readonly components: ReadonlyArray<{
                  readonly name: string
                  readonly port: string
                  readonly role: string
                  readonly invariants: ReadonlyArray<string>
              }>
          }
        | undefined
    readonly codeWalk: ReadonlyArray<{
        readonly id: string
        readonly title: string
        readonly invariant: string
        readonly file: string
        readonly line: number
        readonly snippet: string
        readonly why: string
    }>
    readonly scenarios: ReadonlyArray<EssentialScenarioView>
    readonly challenges: ReadonlyArray<EssentialChallengeView>
    /** The Tìm sạn bug pack's tests; empty for a lesson without one (Tìm sạn then shows the scenarios) or when it is locked. */
    readonly bugs: ReadonlyArray<BugTestView>
    /** The Pattern stacks; empty for a lesson without them or when Pattern is locked. */
    readonly patterns: ReadonlyArray<PatternView>
}

/** Where the newest relayed run of a scenario stands. */
export type ScenarioRunStatus = "running" | "passed" | "failed"

/** The newest relayed run of one scenario (practice, "Đang luyện"). */
export type ScenarioRunView = {
    readonly scenarioId: string
    readonly status: ScenarioRunStatus
    readonly output: string
    readonly why: string
    readonly ledger: string
    readonly guardsOff: ReadonlyArray<string>
    /** The tier of a challenge run; empty for a scenario of Kịch bản. */
    readonly challengeTier: string
    readonly at: string
}

/** The opener of one lesson for the learner: answered, right the first time, right now. */
export type OpenerScoreView = {
    readonly lessonId: string
    readonly answered: number
    readonly firstCorrect: number
    readonly latestCorrect: number
    /** The questions picked right at least once. */
    readonly solved: number
    /** True once the five questions are solved: the opener is passed. */
    readonly isPassed: boolean
    readonly questions: ReadonlyArray<{
        readonly activityId: string
        readonly firstCorrect: boolean
        readonly latestCorrect: boolean
        readonly isSolved: boolean
        readonly attempts: number
    }>
}

/** The state of one rung of the ladder as the back end names it. */
export type ChallengeScoreState = "locked" | "open" | "doing" | "passed"

/** The score of one rubric criterion of a rung. */
export type ChallengeCriterionScoreView = {
    readonly id: string
    readonly points: number
    readonly earned: number
    readonly isCritical: boolean
    readonly passed: boolean
}

/** The score of one rung: points out of the maximum per criterion; `isLocked` and `isPassed` are the back end's answer, never recomputed. */
export type ChallengeScoreView = {
    readonly challengeId: string
    readonly level: ChallengeLevel
    readonly state: ChallengeScoreState
    readonly score: number
    readonly maxScore: number
    readonly isLocked: boolean
    readonly isPassed: boolean
    readonly unlocksNext: boolean
    readonly hiddenGreen: number
    readonly hiddenTotal: number
    readonly isCriticalMet: boolean
    readonly criteria: ReadonlyArray<ChallengeCriterionScoreView>
}
