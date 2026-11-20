import { toOptionalPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { LessonTopicView } from "@modules/domain/lesson"
import type { GuestExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonTopicRequest } from "../../application/get-lesson-topic.contracts"
import type { LessonTopicInput } from "./dto/lesson-topic.input"
import type { LessonTopicType } from "./dto/lesson-topic.type"

/** Maps the topic input and the session to the message params. */
export const toGetLessonTopicParams = (
    identity: IdentityPrincipal | undefined,
    input: LessonTopicInput,
): GuestExecuteParams<GetLessonTopicRequest> => ({
    request: { topic: input.topic, locale: input.locale },
    principal: toOptionalPrincipal(identity),
})

/** Maps the topic page to its GraphQL type; the schema lists every field a learner may read. */
export const toLessonTopicType = (result: LessonTopicView): LessonTopicType => result
