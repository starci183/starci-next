import type { ApplyPartView, ChallengeDetailView, EssenceQuestionView, RubricRowView } from "@starci-next/ui"
import {
    CHALLENGE_LEVELS,
    type ChallengeScoreView,
    type EssentialChallengeView,
    type EssentialView,
    type LessonView,
    type ScenarioRunView,
} from "@/modules/types"
import type { RunWords } from "./words"

/** The rungs of the ladder, easiest first. */
const orderedRungsOf = (essential: EssentialView): ReadonlyArray<EssentialChallengeView> =>
    CHALLENGE_LEVELS.flatMap((level) => essential.challenges.filter((each) => each.level === level))

/** The rung on screen: the one the learner chose (a locked rung cannot be chosen), else the first open one not yet green, else the last green one, else the first. */
const selectedRungOf = (
    essential: EssentialView,
    scores: ReadonlyArray<ChallengeScoreView>,
    chosen: string,
): EssentialChallengeView | undefined => {
    const ordered = orderedRungsOf(essential)
    const stateOf = (rung: EssentialChallengeView) => scores.find((each) => each.challengeId === rung.id)?.state
    const isLocked = (rung: EssentialChallengeView) =>
        scores.find((each) => each.challengeId === rung.id)?.isLocked === true
    return (
        ordered.find((each) => each.id === chosen && !isLocked(each)) ??
        ordered.find((each) => stateOf(each) === "doing" || stateOf(each) === "open") ??
        ordered.findLast((each) => stateOf(each) === "passed") ??
        ordered[0]
    )
}

/** The rubric of a rung: the criteria in words with the points they earned in the newest run. */
const rubricOf = (
    rung: EssentialChallengeView,
    score: ChallengeScoreView | undefined,
    words: RunWords,
): ReadonlyArray<RubricRowView> =>
    rung.rubric.map((criterion) => {
        const scored = score?.criteria.find((each) => each.id === criterion.id)
        const hasRun = score !== undefined && (score.state === "doing" || score.state === "passed")
        const isScored = hasRun && scored !== undefined
        return {
            id: criterion.id,
            criterion: criterion.criterion,
            value: isScored ? words.pointsOf(scored.earned, criterion.points) : words.points(criterion.points),
            points: criterion.points,
            isCritical: criterion.isCritical,
            isEarned: isScored ? scored.passed : undefined,
        }
    })

/** The mark in front of the line of a hidden scenario in the terminal. */
const markOf = (status: ScenarioRunView["status"]): string => {
    if (status === "passed") return "✓"
    return status === "failed" ? "✗" : "…"
}

/** The terminal of a rung: the command and what the newest hidden run reported, scenario by scenario. */
const terminalOf = (
    lessonId: string,
    rung: EssentialChallengeView,
    score: ChallengeScoreView | undefined,
    runs: ReadonlyArray<ScenarioRunView>,
    words: RunWords,
): ReadonlyArray<string> => {
    const command = `$ starci-relay run ${lessonId} --challenge ${rung.level}`
    const tier = runs.filter((run) => run.challengeTier === rung.level)
    if (score === undefined || tier.length === 0) return [command, words.noRunYet]
    return [
        command,
        words.hiddenGreen(score.hiddenGreen, score.hiddenTotal, score.score, score.maxScore),
        ...tier.map((run) => `${markOf(run.status)} ${run.scenarioId}`),
    ]
}

/** What the apply part is built from. */
export type ApplyInput = {
    readonly lesson: LessonView
    readonly essential: EssentialView
    readonly runs: ReadonlyArray<ScenarioRunView>
    readonly scores: ReadonlyArray<ChallengeScoreView>
    readonly chosen: string
    /** The essence check of a rung as the question card draws it (graded on the spot, never before the pick). */
    readonly questionsOf: (rung: EssentialChallengeView) => ReadonlyArray<EssenceQuestionView>
    readonly words: RunWords
}

/**
 * The state of a rung in words: how it opens, how far it stands or that it is green. The first rung has no rung before it: it opens once
 * Tìm sạn is green, so its lock names Tìm sạn. A rung already green reads green even while the back end locks it again (its row carries the
 * green mark and the score, so a lock sentence beside them would contradict the row).
 */
const stateLabelOf = (score: ChallengeScoreView | undefined, words: RunWords, isFirst: boolean): string => {
    if (score?.state === "passed") return words.rungLabels.passed(score.score, score.maxScore)
    if (score === undefined || score.isLocked) return isFirst ? words.rungLabels.lockedFirst : words.rungLabels.locked
    return score.state === "doing" ? words.rungLabels.doing(score.score, score.maxScore) : words.rungLabels.open
}

/** The rung on screen with its brief, terminal, rubric, essence check and score. */
const challengeDetailOf = (input: ApplyInput, rung: EssentialChallengeView): ChallengeDetailView => {
    const { words, scores } = input
    const score = scores.find((each) => each.challengeId === rung.id)
    return {
        id: rung.id,
        heading: `${words.levels[rung.level]} · ${rung.title}`,
        level: words.levels[rung.level],
        brief: rung.brief,
        state: score?.state ?? "locked",
        stateLabel: stateLabelOf(score, words, orderedRungsOf(input.essential)[0]?.id === rung.id),
        rubric: rubricOf(rung, score, words),
        questions: input.questionsOf(rung),
        terminal: terminalOf(input.lesson.id, rung, score, input.runs, words),
        score: score?.score ?? 0,
        maxScore: score?.maxScore ?? 100,
        proofStep: 0,
    }
}

/** The apply part: the four rungs with the state the back end names, and the rung on screen with its score per criterion. */
export const applyOf = (input: ApplyInput): ApplyPartView => {
    const { essential, scores, words } = input
    const ordered = orderedRungsOf(essential)
    const selected = selectedRungOf(essential, scores, input.chosen)
    return {
        rungs: ordered.map((rung) => {
            const score = scores.find((each) => each.challengeId === rung.id)
            return {
                id: rung.id,
                level: words.levels[rung.level],
                title: rung.title,
                state: score?.state ?? "locked",
                stateLabel: stateLabelOf(score, words, ordered[0]?.id === rung.id),
                score: score?.score ?? 0,
                maxScore: score?.maxScore ?? 100,
            }
        }),
        selectedId: selected?.id ?? "",
        challenge: selected === undefined ? undefined : challengeDetailOf(input, selected),
        cvLine: "",
    }
}
