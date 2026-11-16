import type { OpenerScoreView } from "@modules/domain/attempt"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetLessonOpenerScoresRequest } from "../../application/get-lesson-opener-scores.contracts"
import type { LessonOpenerScoresInput } from "./dto/lesson-opener-scores.input"
import type { LessonOpenerScoreType } from "./dto/lesson-opener-score.type"

/** Maps the input and the session to the message params. */
export const toGetLessonOpenerScoresParams = (
    identity: IdentityPrincipal,
    input: LessonOpenerScoresInput,
): ExecuteParams<GetLessonOpenerScoresRequest> => ({
    request: { lessonIds: input.lessonIds },
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the scores to their GraphQL type. */
export const toLessonOpenerScoreTypes = (views: ReadonlyArray<OpenerScoreView>): ReadonlyArray<LessonOpenerScoreType> =>
    views
