import { Injectable } from "@nestjs/common"
import { LessonContentService, LessonReadService } from "@modules/domain/lesson"
import type { ConceptLessonRef, ProjectRubric } from "./project.contracts"
import type { CatalogParams, RubricRequest } from "./project-params.contracts"
import type { ProjectLessonPort } from "./project-lesson.port"

@Injectable()
/** The lesson port over the lesson capability: the live Essentials lessons by id, and the rubric of a lesson's AI-graded written activity. */
export class LessonCatalogClient implements ProjectLessonPort {
    constructor(
        private readonly catalog: LessonReadService,
        private readonly content: LessonContentService,
    ) {}

    /** Every live lesson, titled in the locale, by id; a concept with no entry is still being written. */
    async lessons(params: CatalogParams): Promise<ReadonlyMap<string, ConceptLessonRef>> {
        const items = await this.catalog.catalog({
            locale: params.locale,
            group: null,
            topic: null,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        return new Map(
            items.map((item) => [
                item.id,
                { id: item.id, version: item.version, title: item.title, topicId: item.topic.id },
            ]),
        )
    }

    /** The rubric of the first AI-graded activity the lesson requires; no criteria when it has none. */
    async rubricOf(request: RubricRequest): Promise<ProjectRubric> {
        const { lesson, locale } = request
        const plan = await this.content.plan(lesson.id, lesson.version)
        const found = await Promise.all(
            plan.required.map((activityId) =>
                this.content.activity({ lessonId: lesson.id, version: lesson.version, activityId, locale }),
            ),
        )
        const graded = found.find(
            ({ activity }) => activity.evaluationMethod === "ai-rubric" && (activity.rubric?.length ?? 0) > 0,
        )
        return {
            criteria: (graded?.activity.rubric ?? []).map((criterion) => ({
                id: criterion.id,
                criterion: criterion.criterion,
                expectedEvidence: criterion.expectedEvidence,
                misconception: criterion.misconception,
            })),
        }
    }
}
