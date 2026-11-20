import type { AttemptResult } from "@modules/domain/attempt"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams, PublicExecuteParams } from "@modules/platform/cqrs"
import type { ClaimGuestProgressRequest } from "../../application/claim-guest-progress.contracts"
import type { GradeGuestOpenerRequest } from "../../application/grade-guest-opener.contracts"
import type { ClaimGuestProgressInput } from "./dto/claim-guest-progress.input"
import type { GradeGuestOpenerInput } from "./dto/grade-guest-opener.input"
import type { LessonAttemptResultType } from "./dto/lesson-attempt-result.type"

const answerOf = (input: GradeGuestOpenerInput): GradeGuestOpenerRequest => ({
    lessonId: input.lessonId,
    version: input.version,
    activityId: input.activityId,
    optionId: input.optionId,
    locale: input.locale,
})

/** Maps the guest's pick to the message params; no caller is identified. */
export const toGradeGuestOpenerParams = (
    input: GradeGuestOpenerInput,
): PublicExecuteParams<GradeGuestOpenerRequest> => ({
    request: answerOf(input),
})

/** Maps what the device kept and the session to the message params. */
export const toClaimGuestProgressParams = (
    identity: IdentityPrincipal,
    input: ClaimGuestProgressInput,
): ExecuteParams<ClaimGuestProgressRequest> => ({
    request: {
        answers: input.answers.map((answer) => answerOf(answer)),
        sections: input.sections.map((section) => ({ lessonId: section.lessonId, sectionId: section.sectionId })),
    },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the grade to its GraphQL type; the explanations are released because the guest has answered. */
export const toGuestGradeType = (result: AttemptResult): LessonAttemptResultType => result
