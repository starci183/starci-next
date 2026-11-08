import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ConceptLessonRef, ProjectRubric } from "./project.contracts"
import type { CatalogParams, RubricRequest } from "./project-params.contracts"

/**
 * The port through which the projects capability reads the Essentials lessons behind its concepts: which concepts have a live
 * lesson (the others are still being written by the teacher), where to send a learner who is missing one, and the rubric the AI
 * teacher grades a code read with. The app binds `LessonCatalogClient`, the adapter over the lesson capability.
 */
export interface ProjectLessonPort {
    /** The live lessons by id, titled in the locale. */
    lessons(params: CatalogParams): Promise<ReadonlyMap<string, ConceptLessonRef>>
    /** The rubric of the lesson's AI-graded written activity; no criteria when it has none. */
    rubricOf(request: RubricRequest): Promise<ProjectRubric>
}

/** Token of the lesson port. */
export const PROJECT_LESSONS: unique symbol = Symbol("domain.project.lessons")

/** Injects the lesson port. Parameter type: ProjectLessonPort. */
export const InjectProjectLessons = (): TypedParameterDecorator<ProjectLessonPort> =>
    injector<ProjectLessonPort>(PROJECT_LESSONS)
