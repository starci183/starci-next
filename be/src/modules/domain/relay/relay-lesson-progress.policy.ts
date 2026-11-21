import {
    challengeActivityId,
    LESSON_CHALLENGE_LEVELS,
    type LessonChallenge,
    type LessonEssential,
} from "@modules/domain/lesson"
import type { LessonScenarioRunView } from "./relay-lesson.service"
import { tierBelow } from "./relay-lesson-manifest.policy"

/** The four parts of a lesson page, in the order a learner meets them (the ids the page tabs use). */
export const LESSON_PART_IDS = ["essence", "source", "scenarios", "apply"] as const

/** One part of a lesson page. */
export type LessonPartId = (typeof LESSON_PART_IDS)[number]

/** Where a learner stands in one part: nothing yet, under way, done, or not theirs to read (no Premium). */
export type LessonPartState = "none" | "doing" | "done" | "locked"

/** The progress of one part of one lesson. */
export interface LessonPartProgress {
    /** The part. */
    readonly part: LessonPartId
    /** Where the learner stands. */
    readonly state: LessonPartState
    /** What is done: questions answered, 1 once the source was pulled, scenarios green, rungs passed. */
    readonly done: number
    /** What there is to do in the part (0 when the lesson ships none). */
    readonly total: number
}

/** What the progress of one lesson is built from; every field is already read. */
export interface LessonProgressFacts {
    /** The stored four-part fields of the live version, or null for a lesson that ships none. */
    readonly essential: LessonEssential | null
    /** The opener questions the learner answered right (solved); the opener is done once every one is. */
    readonly openerAnswered: number
    /** Which parts the learner may read (the entitlement setting). */
    readonly readable: Readonly<Record<LessonPartId, boolean>>
    /** The newest relayed run of each scenario and hidden scenario, by check id. */
    readonly runs: ReadonlyArray<LessonScenarioRunView>
    /** True once the lesson's task has any event of the learner's devices (the source was pulled, a check ran). */
    readonly hasEvents: boolean
    /** The newest graded answer of each challenge essence question, by activity id. */
    readonly choices: ReadonlyMap<string, boolean>
}

/** One rubric criterion of a rung with what it earned. */
export interface ChallengeCriterionScore {
    /** The criterion id. */
    readonly id: string
    /** The points it is worth. */
    readonly points: number
    /** The points it earned: all of them or none. */
    readonly earned: number
    /** Whether it is the critical one. */
    readonly isCritical: boolean
    /** Whether it passed. */
    readonly passed: boolean
}

/** Where a rung of the ladder stands. */
export type ChallengeRungState = "locked" | "open" | "doing" | "passed"

/** The score of one rung of the ladder. */
export interface ChallengeScore {
    /** The challenge id. */
    readonly challengeId: string
    /** The rung. */
    readonly level: string
    /** Where it stands. */
    readonly state: ChallengeRungState
    /** The points earned out of 100. */
    readonly score: number
    /** The points the rubric is worth. */
    readonly maxScore: number
    /** True when the tier below is not passed yet: the back end refuses a run (RELAY_CHALLENGE_LOCKED). */
    readonly isLocked: boolean
    /** True when every hidden scenario of the rung is green: the rule that opens the next rung. */
    readonly isPassed: boolean
    /** True when the next rung opens from this one (the same flag as `isPassed`; named for the page). */
    readonly unlocksNext: boolean
    /** The hidden scenarios that are green. */
    readonly hiddenGreen: number
    /** The hidden scenarios that judge the rung. */
    readonly hiddenTotal: number
    /** True when every critical criterion earned its points. */
    readonly isCriticalMet: boolean
    /** Each criterion with what it earned. */
    readonly criteria: ReadonlyArray<ChallengeCriterionScore>
}

/** The newest run of a check is green when it passed with no guard switched off (the rule `allGreen` applies). */
const isGreen = (run: LessonScenarioRunView | undefined): boolean =>
    run !== undefined && run.status === "passed" && run.guardsOff.length === 0

const runsById = (runs: ReadonlyArray<LessonScenarioRunView>): ReadonlyMap<string, LessonScenarioRunView> =>
    new Map(runs.map((run) => [run.scenarioId, run]))

/** The ids of the hidden scenarios of a rung. */
const hiddenIdsOf = (challenge: LessonChallenge | undefined): ReadonlyArray<string> =>
    (challenge?.hidden ?? []).map((each) => each.id)

/** Whether every essence question of a rung was answered right (a rung with no question has none to fail). */
const essenceMetOf = (challenge: LessonChallenge, choices: ReadonlyMap<string, boolean>): boolean =>
    (challenge.questions ?? []).every(
        (question) => choices.get(challengeActivityId(challenge.id, question.id)) === true,
    )

/**
 * The score of every rung of the ladder, from the hidden scenario runs and the essence answers. The criteria of a rubric are
 * mapped to what judges them by position, because the content names no link: when the rung has an essence check, the LAST
 * criterion is judged by it (all its questions right); the other criteria are judged by the hidden scenarios, scenario `i`
 * belonging to criterion `i mod m` of the `m` remaining ones, and a criterion no scenario belongs to passes with the whole rung.
 * A criterion earns all its points or none. Whether a rung is locked or passed is the back end's own rule and is not read
 * from the score: a rung opens when every hidden scenario of the tier below is green.
 */
export const challengeScoresOf = (
    essential: LessonEssential | null,
    runs: ReadonlyArray<LessonScenarioRunView>,
    choices: ReadonlyMap<string, boolean>,
): ReadonlyArray<ChallengeScore> => {
    const challenges = essential?.challenges ?? []
    const byId = runsById(runs)
    const order = (level: string): number => LESSON_CHALLENGE_LEVELS.findIndex((each) => each === level)
    return [...challenges]
        .sort((a, b) => order(a.level) - order(b.level))
        .map((challenge) => {
            const hidden = hiddenIdsOf(challenge)
            const green = hidden.filter((id) => isGreen(byId.get(id)))
            const isPassed = hidden.length > 0 && green.length === hidden.length
            const below = tierBelow(challenge.level)
            const belowIds = below === null ? [] : hiddenIdsOf(challenges.find((each) => each.level === below))
            const isLocked = !belowIds.every((id) => isGreen(byId.get(id)))
            const hasEssence = (challenge.questions ?? []).length > 0
            const essenceIndex = hasEssence ? challenge.rubric.length - 1 : -1
            const scenarioCount = challenge.rubric.length - (hasEssence ? 1 : 0)
            const criteria = challenge.rubric.map((criterion, index): ChallengeCriterionScore => {
                const passed =
                    index === essenceIndex
                        ? essenceMetOf(challenge, choices)
                        : hidden.length > 0 &&
                          (() => {
                              const own = hidden.filter((_, at) => at % scenarioCount === index)
                              return (own.length === 0 ? hidden : own).every((id) => isGreen(byId.get(id)))
                          })()
                return {
                    id: criterion.id,
                    points: criterion.points,
                    earned: passed ? criterion.points : 0,
                    isCritical: criterion.isCritical === true,
                    passed,
                }
            })
            const touched =
                hidden.some((id) => byId.has(id)) ||
                [...choices.keys()].some((key) => key.startsWith(`challenge.${challenge.id}.`))
            const state: ChallengeRungState = isPassed ? "passed" : isLocked ? "locked" : touched ? "doing" : "open"
            return {
                challengeId: challenge.id,
                level: challenge.level,
                state,
                score: criteria.reduce((sum, each) => sum + each.earned, 0),
                maxScore: criteria.reduce((sum, each) => sum + each.points, 0),
                isLocked,
                isPassed,
                unlocksNext: isPassed,
                hiddenGreen: green.length,
                hiddenTotal: hidden.length,
                isCriticalMet: criteria.filter((each) => each.isCritical).every((each) => each.passed),
                criteria,
            }
        })
}

/** The state of a part from what is done and what there is. */
const stateOf = (done: number, total: number, hasStarted: boolean): LessonPartState =>
    total > 0 && done >= total ? "done" : done > 0 || hasStarted ? "doing" : "none"

/**
 * The progress of the four parts of one lesson. A part the learner may not read is `locked` with nothing done (its payload is
 * never read, so the facts carry no runs for it). `inProgressPart` is the first readable part that is not done and has something
 * to do, which is where "Học tiếp" goes; null when every part is done or the lesson ships none.
 */
export const lessonPartsOf = (
    facts: LessonProgressFacts,
): { readonly parts: ReadonlyArray<LessonPartProgress>; readonly inProgressPart: LessonPartId | null } => {
    const essential = facts.essential
    const hasSource = (essential?.source ?? null) !== null
    const scenarioRuns = facts.runs.filter((run) => run.slot !== "challenge")
    const scenarioIds = (essential?.scenarios ?? []).map((scenario) => scenario.id)
    const scenarioGreen = scenarioIds.filter((id) => isGreen(scenarioRuns.find((run) => run.scenarioId === id))).length
    const rungs = challengeScoresOf(essential, facts.runs, facts.choices)
    const raw: Record<LessonPartId, Omit<LessonPartProgress, "part">> = {
        essence: {
            done: Math.min(facts.openerAnswered, essential?.opener.length ?? facts.openerAnswered),
            total: essential?.opener.length ?? 0,
            state: stateOf(facts.openerAnswered, essential?.opener.length ?? 0, false),
        },
        source: {
            done: facts.hasEvents && hasSource ? 1 : 0,
            total: !hasSource ? 0 : 1,
            state: stateOf(facts.hasEvents && hasSource ? 1 : 0, !hasSource ? 0 : 1, false),
        },
        scenarios: {
            done: scenarioGreen,
            total: scenarioIds.length,
            state: stateOf(scenarioGreen, scenarioIds.length, scenarioRuns.length > 0),
        },
        apply: {
            done: rungs.filter((rung) => rung.isPassed).length,
            total: rungs.length,
            state: stateOf(
                rungs.filter((rung) => rung.isPassed).length,
                rungs.length,
                rungs.some((rung) => rung.state === "doing"),
            ),
        },
    }
    const parts = LESSON_PART_IDS.map((part): LessonPartProgress => {
        const own = raw[part]
        return facts.readable[part] ? { part, ...own } : { part, state: "locked", done: 0, total: own.total }
    })
    const next = parts.find((each) => each.state !== "locked" && each.state !== "done" && each.total > 0)
    return { parts, inProgressPart: next?.part ?? null }
}
