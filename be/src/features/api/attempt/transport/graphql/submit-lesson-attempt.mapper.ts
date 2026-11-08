import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitLessonAttemptRequest } from "../../application/submit-lesson-attempt.contracts"
import type { SubmitLessonAttemptInput } from "./dto/submit-lesson-attempt.input"

/** Maps the submit input and the session to the message params. */
export const toSubmitLessonAttemptParams = (
    identity: IdentityPrincipal,
    input: SubmitLessonAttemptInput,
): ExecuteParams<SubmitLessonAttemptRequest> => ({
    request: {
        lessonId: input.lessonId,
        version: input.version,
        activityId: input.activityId,
        revision: input.revision,
        locale: input.locale,
        answer: {
            optionId: input.answer.optionId,
            text: input.answer.text,
            actionIds: input.answer.actionIds,
            reachedStateId: input.answer.reachedStateId,
            debrief: input.answer.debrief,
            files: input.answer.files,
        },
    },
    principal: { id: identity.subject, role: "authenticated" },
})
