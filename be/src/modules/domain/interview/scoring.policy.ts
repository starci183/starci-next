import {
    STAR_KEYS,
    TECHNICAL_DIMENSIONS,
    type AttributeScore,
    type ChecklistResult,
    type DimensionResult,
    type Gap,
    type GradedQuestion,
    type GradingMaterial,
    type InterviewFamily,
    type InterviewVerdict,
    type QuestionScore,
    type Scorecard,
} from "./interview.contracts"

/** The numbers that turn a grader's reading into scores and a verdict. */
export interface ScoringRules {
    /** The points one hint takes off a question. */
    readonly hintPenalty: number
    /** The points a weak ownership signal takes off a behavioural question. */
    readonly ownershipDeduction: number
    /** The score from which a session passes. */
    readonly passScore: number
    /** The score from which a session is borderline. */
    readonly borderlineScore: number
}

/** The verdict lines proposed for the mock interview: pass at 70, borderline at 50. */
export const DEFAULT_SCORING_RULES: ScoringRules = {
    hintPenalty: 5,
    ownershipDeduction: 15,
    passScore: 70,
    borderlineScore: 50,
}

/** One question of a session with what the grader read of it. */
export interface ScoringQuestion {
    /** The position. */
    readonly position: number
    /** The question id. */
    readonly questionId: string
    /** The family. */
    readonly family: InterviewFamily
    /** The grading material in the session locale. */
    readonly material: GradingMaterial
    /** The ideal answer in the session language and locale. */
    readonly idealAnswer: string
    /** The module slugs of the bank. */
    readonly moduleRefs: ReadonlyArray<string>
    /** True when the learner skipped the question. */
    readonly skipped: boolean
    /** The hints the learner used. */
    readonly hintsUsed: number
    /** The grader's reading; null for a skipped question. */
    readonly graded: GradedQuestion | null
}

const LEVEL_MAX = 4
const MAX_GAPS = 6
const MAX_STRENGTHS = 5

const mean = (values: ReadonlyArray<number>): number =>
    values.length === 0 ? 0 : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

/** The verdict of a score and the number of critical items missed: pass needs none, a single miss keeps a high score borderline. */
export const verdictOf = (score: number, criticalMissed: number, rules: ScoringRules): InterviewVerdict => {
    if (score >= rules.passScore) {
        if (criticalMissed === 0) return "pass"
        return criticalMissed === 1 ? "borderline" : "fail"
    }
    return score >= rules.borderlineScore ? "borderline" : "fail"
}

const technicalScore = (question: ScoringQuestion, rules: ScoringRules): QuestionScore => {
    const hits = new Map((question.graded?.checklist ?? []).map((hit) => [hit.item, hit]))
    const checklist = question.material.checklist.map((item, index): ChecklistResult => {
        const hit = hits.get(index)
        const shown = hit?.hit === true
        return { ...item, hit: shown, evidenceQuote: hit?.hit === true ? hit.evidenceQuote : "" }
    })
    const base = checklist.reduce((sum, item) => sum + (item.hit ? item.scoreBand : 0), 0)
    const hintPenalty = Math.min(base, question.hintsUsed * rules.hintPenalty)
    return {
        position: question.position,
        questionId: question.questionId,
        family: "technical",
        skipped: question.skipped,
        score: base - hintPenalty,
        hintsUsed: question.hintsUsed,
        hintPenalty,
        criticalMissed: checklist.filter((item) => item.critical && !item.hit).map((item) => item.text),
        checklist,
        dimensions: [],
        ownershipWeak: false,
        note: question.graded?.note ?? "",
        idealAnswer: question.idealAnswer,
    }
}

const behavioralScore = (question: ScoringQuestion, rules: ScoringRules): QuestionScore => {
    const levels = new Map((question.graded?.dimensions ?? []).map((entry) => [entry.key, entry]))
    const dimensions = question.material.star.map((line): DimensionResult => {
        const entry = levels.get(line.key)
        if (entry === undefined) return { key: line.key, text: line.text, level: 0, evidenceQuote: "" }
        const level = Math.min(LEVEL_MAX, Math.max(0, entry.level))
        return { key: line.key, text: line.text, level, evidenceQuote: level > 0 ? entry.evidenceQuote : "" }
    })
    const ownershipWeak = question.graded?.ownershipWeak === true
    const base = mean(dimensions.map((entry) => (entry.level / LEVEL_MAX) * 100))
    return {
        position: question.position,
        questionId: question.questionId,
        family: "behavioral",
        skipped: question.skipped,
        score: Math.max(0, base - (ownershipWeak && !question.skipped ? rules.ownershipDeduction : 0)),
        hintsUsed: 0,
        hintPenalty: 0,
        criticalMissed: [],
        checklist: [],
        dimensions,
        ownershipWeak,
        note: question.graded?.note ?? "",
        idealAnswer: "",
    }
}

const scoreOf = (question: ScoringQuestion, rules: ScoringRules): QuestionScore =>
    question.family === "technical" ? technicalScore(question, rules) : behavioralScore(question, rules)

/** The score of each technical dimension (the share of its checklist points shown) and of each STAR dimension (its mean level). */
const attributesOf = (scores: ReadonlyArray<QuestionScore>): ReadonlyArray<AttributeScore> => {
    const items = scores.flatMap((entry) => entry.checklist)
    const technical = TECHNICAL_DIMENSIONS.flatMap((dimension): Array<AttributeScore> => {
        const ofDimension = items.filter((item) => item.dimension === dimension)
        const total = ofDimension.reduce((sum, item) => sum + item.scoreBand, 0)
        const earned = ofDimension.reduce((sum, item) => sum + (item.hit ? item.scoreBand : 0), 0)
        return total === 0 ? [] : [{ key: dimension, score: Math.round((earned / total) * 100) }]
    })
    const dimensions = scores.flatMap((entry) => entry.dimensions)
    const star = STAR_KEYS.flatMap((key): Array<AttributeScore> => {
        const levels = dimensions.filter((entry) => entry.key === key).map((entry) => (entry.level / LEVEL_MAX) * 100)
        return levels.length === 0 ? [] : [{ key, score: mean(levels) }]
    })
    return [...technical, ...star]
}

const strengthsOf = (scores: ReadonlyArray<QuestionScore>): ReadonlyArray<string> =>
    scores
        .flatMap((entry) => [
            ...entry.checklist.filter((item) => item.hit).map((item) => item.text),
            ...entry.dimensions.filter((item) => item.level >= 3).map((item) => item.text),
        ])
        .slice(0, MAX_STRENGTHS)

const gapsOf = (
    scored: ReadonlyArray<{ readonly question: ScoringQuestion; readonly entry: QuestionScore }>,
): ReadonlyArray<Gap> =>
    scored
        .flatMap(({ question, entry }) => {
            const moduleRefs = question.moduleRefs
            const missed = entry.checklist.filter((item) => !item.hit)
            const critical = missed.filter((item) => item.critical)
            const ordered = [...critical, ...missed.filter((item) => !item.critical)]
            const weak = entry.dimensions.filter((item) => item.level <= 1)
            return [...ordered, ...weak].map((item): Gap => ({ text: item.text, position: entry.position, moduleRefs }))
        })
        .slice(0, MAX_GAPS)

/** The score and the verdict of one pillar; both are null when the session holds no question of that family. */
interface PillarScore {
    /** The mean score, or null. */
    readonly score: number | null
    /** The verdict, or null. */
    readonly verdict: InterviewVerdict | null
}

const pillarOf = (scores: ReadonlyArray<QuestionScore>, family: InterviewFamily, rules: ScoringRules): PillarScore => {
    const of = scores.filter((entry) => entry.family === family)
    if (of.length === 0) return { score: null, verdict: null }
    const score = mean(of.map((entry) => entry.score))
    return {
        score,
        verdict: verdictOf(
            score,
            of.reduce((sum, entry) => sum + entry.criticalMissed.length, 0),
            rules,
        ),
    }
}

/**
 * Scores a session on the server from what the grader read. A technical question earns the checklist points the answer showed,
 * minus the hint penalty; a behavioural question is the mean of its six STAR levels, minus the ownership deduction. The two
 * families are scored as separate pillars; the overall score is the mean over every question the learner answered or skipped. The
 * model reads the answer; it never computes a score.
 */
export const scorecardOf = (questions: ReadonlyArray<ScoringQuestion>, rules: ScoringRules): Scorecard => {
    const scored = questions.map((question) => ({ question, entry: scoreOf(question, rules) }))
    const scores = scored.map(({ entry }) => entry)
    const technical = pillarOf(scores, "technical", rules)
    const behavioral = pillarOf(scores, "behavioral", rules)
    const overallScore = mean(scores.map((entry) => entry.score))
    const criticalMissed = scores.reduce((sum, entry) => sum + entry.criticalMissed.length, 0)
    return {
        overallScore,
        verdict: verdictOf(overallScore, criticalMissed, rules),
        technicalScore: technical.score,
        technicalVerdict: technical.verdict,
        behavioralScore: behavioral.score,
        behavioralVerdict: behavioral.verdict,
        attributes: attributesOf(scores),
        questions: scores,
        strengths: strengthsOf(scores),
        gaps: gapsOf(scored),
    }
}
