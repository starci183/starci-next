/** The rungs of the challenge ladder, easiest first. */
export const CHALLENGE_LEVELS = ["easy", "medium", "hard", "insane"] as const

/** One rung of the challenge ladder. */
export type ChallengeLevel = (typeof CHALLENGE_LEVELS)[number]

/** The four parts of a lesson page, in the order a learner meets them. */
export const ESSENTIAL_PARTS = ["essence", "source", "scenarios", "apply"] as const

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
}

/** One scenario of Kịch bản. */
export type EssentialScenarioView = {
    readonly id: string
    readonly title: string
    readonly fault: string
    readonly expected: string
    readonly invariant: string
    readonly guards: ReadonlyArray<string>
    readonly hint: string
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
}

/** The four parts of a lesson as the page reads them; a part the learner may not read is empty and named in `lockedParts`. */
export type EssentialView = {
    /** True when at least one part is locked for the learner. */
    readonly isLocked: boolean
    /** The parts the learner may not read (by default Source, Kịch bản and Tự áp dụng without Premium); never their payload. */
    readonly lockedParts: ReadonlyArray<EssentialPart>
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
    readonly questions: ReadonlyArray<{
        readonly activityId: string
        readonly firstCorrect: boolean
        readonly latestCorrect: boolean
        readonly attempts: number
    }>
}
