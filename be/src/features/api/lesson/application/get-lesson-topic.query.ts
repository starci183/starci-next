import { Query } from "@nestjs/cqrs"
import type { LessonTopicView } from "@modules/domain/lesson"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonTopicRequest } from "./get-lesson-topic.contracts"

/** Asks for the page of one topic for a learner or a guest. */
export class GetLessonTopicQuery extends Query<LessonTopicView> {
    constructor(readonly params: GuestExecuteParams<GetLessonTopicRequest>) {
        super()
    }
}
