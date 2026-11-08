import { parseMarkdown } from "@/modules/markdown"
import {
    LESSON_PHASES,
    type ActivityView,
    type AttemptView,
    type CatalogLessonView,
    type LessonDifficulty,
    type LessonView,
    type ProgressView,
    type SectionView,
    type TopicView,
} from "@/modules/types"
import type {
    LessonProgressQuery,
    LessonQuery,
    LessonsQuery,
    LessonTopicQuery,
    SubmitLessonAttemptMutation,
} from "@/modules/api"

/** The lesson of the answer as the study screen reads it. */
type LessonWire = LessonQuery["lesson"]

/** The difficulty the back end names; anything else is a contract break and stops here. */
const difficultyOf = (raw: string): LessonDifficulty => {
    if (raw === "foundation" || raw === "intermediate" || raw === "advanced") return raw
    throw new Error(`unknown difficulty ${raw}`)
}

/** The phase of a section; the overview and the review are not sections. */
const sectionPhaseOf = (raw: string): SectionView["phase"] => {
    const phase = LESSON_PHASES.find((each) => each === raw && each !== "overview" && each !== "review")
    if (phase === undefined) throw new Error(`unknown phase ${raw}`)
    return phase
}

/** The kind of an activity; anything else is a contract break and stops here. */
const kindOf = (raw: string): ActivityView["kind"] => {
    if (raw === "explain" || raw === "choice" || raw === "simulation" || raw === "exercise" || raw === "retrieval")
        return raw
    throw new Error(`unknown activity kind ${raw}`)
}

/** The activity of the answer as the learner sees it before a submit. */
const activityOf = (wire: LessonWire["sections"][number]["activities"][number]): ActivityView => ({
    id: wire.id,
    kind: kindOf(wire.kind),
    prompt: wire.prompt,
    isDiagnostic: wire.isDiagnostic,
    criteria: wire.criteria.map((criterion) => criterion.criterion),
    options: wire.options,
    simulation:
        wire.simulation === null
            ? undefined
            : {
                  initialStateId: wire.simulation.initialStateId,
                  debriefQuestion: wire.simulation.debriefQuestion,
                  states: wire.simulation.states,
                  actions: wire.simulation.actions,
                  edges: wire.simulation.transitions,
              },
    instructions: wire.exercise?.submissionInstructions ?? "",
    files: (wire.exercise?.files ?? []).map((file) => ({
        path: file.relativePath,
        language: file.syntaxLanguage,
        content: file.content,
    })),
})

/** A section of the answer with its body read into blocks; a locked section carries no body and no activity. */
const sectionOf = (wire: LessonWire["sections"][number]): SectionView => ({
    id: wire.id,
    phase: sectionPhaseOf(wire.phase),
    title: wire.title,
    isLocked: wire.locked,
    blocks: wire.body === null ? [] : parseMarkdown(wire.body),
    activities: wire.activities.map((activity) => activityOf(activity)),
})

/** True for a reference the import keeps for its own record (the legacy source a lesson was migrated from): the learner is not shown it. */
const isInternalReference = (citation: string): boolean => citation.startsWith("legacy;")

/** The lesson of the answer, in the shape the study block draws. */
export const lessonOf = (wire: LessonWire): LessonView => ({
    id: wire.id,
    title: wire.title,
    description: wire.description,
    category: wire.category,
    group: wire.group,
    topic: wire.topic,
    difficulty: difficultyOf(wire.difficulty),
    minutes: wire.minutes,
    implementation: wire.implementation,
    overview: parseMarkdown(wire.overview),
    outcomes: wire.learningOutcomes,
    prerequisites: wire.prerequisites,
    references: wire.references
        .filter((reference) => !isInternalReference(reference.citation))
        .map((reference) => ({
            id: reference.id,
            label: reference.label,
            href: reference.url ?? "",
        })),
    isPremium: wire.isPremium,
    version: wire.version,
    sections: wire.sections.toSorted((a, b) => a.sortIndex - b.sortIndex).map((section) => sectionOf(section)),
    files: (wire.workspace?.files ?? []).map((file) => ({
        path: file.path,
        language: file.path.endsWith(".ts") ? "typescript" : "",
        content: file.content,
    })),
})

/** The lessons of the catalog answer, in the shape the catalog filters. */
export const catalogLessonsOf = (wire: LessonsQuery): ReadonlyArray<CatalogLessonView> =>
    wire.lessons.map((item) => ({ ...item, difficulty: difficultyOf(item.difficulty) }))

/** The topic of the answer: its path in the teacher's order, a lesson not moved yet carrying no id. */
export const topicOf = (wire: LessonTopicQuery): TopicView => ({
    id: wire.lessonTopic.id,
    title: wire.lessonTopic.title,
    group: wire.lessonTopic.group,
    source: wire.lessonTopic.from,
    description: wire.lessonTopic.description ?? "",
    prerequisites: wire.lessonTopic.prerequisites ?? [],
    related: (wire.lessonTopic.related ?? []).map((topic) => ({
        id: topic.id,
        title: topic.title,
        listed: topic.listed,
    })),
    path: wire.lessonTopic.path
        .toSorted((a, b) => a.order - b.order)
        .map((row) => ({ order: row.order, title: row.title, lessonId: row.lessonId ?? "" })),
})

/** The attempt as the server answered it, the same shape from the mutation and from the attempt query. */
type AttemptWire = SubmitLessonAttemptMutation["submitLessonAttempt"]

/** The status of an attempt; anything else is a contract break and stops here. */
const statusOf = (raw: string): AttemptView["status"] => {
    if (raw === "saved" || raw === "grading" || raw === "graded" || raw === "failed") return raw
    throw new Error(`unknown attempt status ${raw}`)
}

/** The attempt of the answer, with its result when it carries one. */
export const attemptOf = (wire: AttemptWire): AttemptView => ({
    attemptId: wire.attemptId,
    activityId: wire.activityId,
    revision: wire.revision,
    status: statusOf(wire.status),
    failureCode: wire.failureCode ?? "",
    result:
        wire.result === null
            ? undefined
            : {
                  correct: wire.result.correct ?? undefined,
                  success: wire.result.success ?? undefined,
                  reachedStateId: wire.result.reachedStateId ?? "",
                  score: wire.result.score,
                  maxScore: wire.result.maxScore,
                  isDiagnostic: wire.result.isDiagnostic,
                  options: wire.result.options,
                  criteria: wire.result.criteria.map((criterion) => ({
                      id: criterion.criterionId,
                      criterion: criterion.criterion,
                      level: criterion.level,
                      evidence: criterion.evidenceQuote,
                      maxScore: criterion.maxScore,
                  })),
              },
})

/** The progress of the answer. */
export const progressOf = (wire: LessonProgressQuery): ProgressView => ({
    phase: wire.lessonProgress.phase,
    outcomes: wire.lessonProgress.outcomes,
    total: wire.lessonProgress.attempts.total,
    activities: wire.lessonProgress.activities.map((activity) => ({
        activityId: activity.activityId,
        phase: activity.phase,
        latestAttemptId: activity.latestAttemptId,
        latestStatus: activity.latestStatus,
    })),
})
