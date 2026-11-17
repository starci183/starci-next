import type { ExperienceGrade, ProduceExperienceParams, PracticePatternEvidence } from "./career.contracts"
import { CareerErrorCode } from "./errors/career.error"

/** The catalog item the practice part grants: every problem of one pattern accepted, none after a revealed solution. */
export const PRACTICE_ITEM_TYPE = "practice.pattern-solved"

/** The level of a criterion that holds. */
const MET_LEVEL = 2

/**
 * Why a pattern cannot be claimed yet, or null when it can: some problem is not accepted (or the pattern has none), or the
 * solution of a problem was revealed before that problem was first accepted.
 */
export const practiceRefusalOf = (evidence: PracticePatternEvidence): CareerErrorCode | null => {
    if (evidence.problemCount === 0 || evidence.acceptedCount < evidence.problemCount)
        return CareerErrorCode.PracticeIncomplete
    return evidence.viewedCount > 0 ? CareerErrorCode.PracticeSolutionViewed : null
}

/** The grade of a claimable pattern: both criteria hold, since a pattern that does not meet them is refused first. */
export const practiceGradeOf = (evidence: PracticePatternEvidence): ExperienceGrade => ({
    result: "pass",
    criteria: [
        {
            criterion: "every problem of the pattern is accepted on the hidden tests",
            level: MET_LEVEL,
            evidenceQuote: `accepted ${evidence.acceptedCount}/${evidence.problemCount}`,
        },
        {
            criterion: "no reference solution was revealed before a problem was accepted",
            level: MET_LEVEL,
            evidenceQuote: `${evidence.viewedCount} revealed before accepted`,
        },
    ],
})

/**
 * What the experience engine is handed for a claimed pattern: the subject is the pattern id, the evidence one judge-proved entry
 * naming the pattern, and the slots (problem count, pattern title, language) come from the practice capability in both locales.
 */
export const practiceExperienceOf = (
    learnerId: string,
    vi: PracticePatternEvidence,
    en: PracticePatternEvidence,
    at: string,
): ProduceExperienceParams => {
    const slotsOf = (evidence: PracticePatternEvidence): Readonly<Record<string, string>> => ({
        count: String(evidence.problemCount),
        pattern: evidence.title,
        language: evidence.language ?? "",
    })
    return {
        learnerId,
        itemType: PRACTICE_ITEM_TYPE,
        subject: vi.patternId,
        projectId: null,
        evidence: [{ kind: "practice-pattern", ref: vi.patternId, proofForm: "judge", at }],
        slotValues: { vi: slotsOf(vi), en: slotsOf(en) },
        grade: practiceGradeOf(vi),
    }
}
