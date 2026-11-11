import type { AttemptView } from "@modules/domain/attempt"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonAttemptRequest } from "../../application/get-lesson-attempt.contracts"
import type { LessonAttemptInput } from "./dto/lesson-attempt.input"
import type { LessonAttemptType } from "./dto/lesson-attempt.type"

/** Maps the attempt input and the session to the message params. */
export const toGetLessonAttemptParams = (
    identity: IdentityPrincipal,
    input: LessonAttemptInput,
): ExecuteParams<GetLessonAttemptRequest> => ({
    request: { attemptId: input.attemptId },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps an attempt to its GraphQL type; the result already holds only what the learner may read after a submit. */
export const toLessonAttemptType = (view: AttemptView): LessonAttemptType => ({
    attemptId: view.attemptId,
    lessonId: view.lessonId,
    version: view.lessonVersion,
    activityId: view.activityId,
    revision: view.revision,
    kind: view.kind,
    phase: view.phase,
    status: view.status,
    answer: view.answer,
    result: view.result,
    failureCode: view.failureCode,
    submittedAt: view.submittedAt,
    gradedAt: view.gradedAt,
})
