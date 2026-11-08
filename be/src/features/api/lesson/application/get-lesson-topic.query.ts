import { Query } from "@nestjs/cqrs"
import type { LessonTopicView } from "@modules/domain/lesson"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonTopicRequest } from "./get-lesson-topic.contracts"

/** Asks for the page of one topic on behalf of a signed-in learner. */
export class GetLessonTopicQuery extends Query<LessonTopicView> {
    constructor(readonly params: ExecuteParams<GetLessonTopicRequest>) {
        super()
    }
}
