import type { LessonProgressView } from "@modules/domain/attempt"
import type { LessonView } from "@modules/domain/lesson"
import type { ExperienceGrade, ProduceExperienceParams } from "./career.contracts"

/** The catalog item Essentials grants. */
export const ESSENTIALS_ITEM_TYPE = "essentials.concept-proved"

/** The proved level an outcome needs: level 2, the full share of an exercise's points. */
const PROVED_LEVEL = 2

/** The lesson language that names none. */
const AGNOSTIC = "agnostic"

/** The project a lesson is attached to, as the projects shard proves it. */
export interface AttachedProject {
    /** The project id. */
    readonly projectId: string
    /** The project title, from the project's declared facts. */
    readonly title: string
    /** The language of the project's workspace, used when the lesson is language-agnostic. */
    readonly language: string
}

/** What the Essentials rule reads: the lesson in both locales, the learner's progress in it and the project it is attached to. */
export interface EssentialsEvidence {
    /** The learner. */
    readonly learnerId: string
    /** The lesson, in Vietnamese. */
    readonly lessonVi: LessonView
    /** The lesson, in English. */
    readonly lessonEn: LessonView
    /** The learner's progress in the lesson, from the attempt capability. */
    readonly progress: LessonProgressView
    /** The project. */
    readonly project: AttachedProject
    /** When the evidence was read, as an ISO 8601 instant. */
    readonly at: string
}

/** The grade of the lesson: every learning outcome proved at level 2 passes; the levels are StarCi's, never the learner's. */
export const essentialsGradeOf = (lesson: LessonView, progress: LessonProgressView): ExperienceGrade => {
    const levels = new Map(progress.outcomes.map((outcome) => [outcome.id, outcome.proved]))
    const criteria = lesson.learningOutcomes.map((outcome) => {
        const level = levels.get(outcome.id) ?? 0
        return { criterion: outcome.text, level, evidenceQuote: `proved level ${level}/${PROVED_LEVEL}` }
    })
    const passed = criteria.length > 0 && criteria.every((criterion) => criterion.level >= PROVED_LEVEL)
    return { result: passed ? "pass" : "fail", criteria }
}

/**
 * The Essentials rule (decision.program.structure): a lesson counts toward a CV line only attached to a project, and becomes
 * ai-graded only once every outcome is proved; the slots are the lesson title, the project title, the language and the lesson id.
 */
export const essentialsExperienceOf = (evidence: EssentialsEvidence): ProduceExperienceParams => {
    const { lessonVi, lessonEn, project } = evidence
    const language = lessonVi.implementation === AGNOSTIC ? project.language : lessonVi.implementation
    const slotsOf = (lesson: LessonView): Readonly<Record<string, string>> => ({
        concept: lesson.title,
        project: project.title,
        language,
        lesson: lesson.id,
    })
    return {
        learnerId: evidence.learnerId,
        itemType: ESSENTIALS_ITEM_TYPE,
        subject: `${lessonVi.id}@${project.projectId}`,
        projectId: project.projectId,
        evidence: [{ kind: "lesson-proved", ref: lessonVi.id, proofForm: "proved-lesson", at: evidence.at }],
        slotValues: { vi: slotsOf(lessonVi), en: slotsOf(lessonEn) },
        grade: essentialsGradeOf(lessonVi, evidence.progress),
    }
}
