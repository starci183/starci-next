import type { LessonProgressView } from "@modules/domain/attempt"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonProgressRequest } from "../../application/get-lesson-progress.contracts"
import type { LessonProgressInput } from "./dto/lesson-progress.input"
import type { LessonProgressType } from "./dto/lesson-progress.type"
import { toLessonAttemptType } from "./get-lesson-attempt.mapper"

/** Maps the progress input and the session to the message params. */
export const toGetLessonProgressParams = (
    identity: IdentityPrincipal,
    input: LessonProgressInput,
): ExecuteParams<GetLessonProgressRequest> => ({
    request: { lessonId: input.lessonId, locale: input.locale },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the progress to its GraphQL type. */
export const toLessonProgressType = (view: LessonProgressView): LessonProgressType => ({
    ...view,
    activities: view.activities.map((activity) => ({ ...activity, latest: toLessonAttemptType(activity.latest) })),
})
