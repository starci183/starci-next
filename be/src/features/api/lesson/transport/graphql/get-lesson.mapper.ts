import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LessonView } from "@modules/domain/lesson"
import type { GetLessonRequest } from "../../application/get-lesson.contracts"
import type { LessonInput } from "./dto/lesson.input"
import type { LessonType } from "./dto/lesson.type"

/** Maps the lesson input and the session to the message params. */
export const toGetLessonParams = (
    identity: IdentityPrincipal,
    input: LessonInput,
): ExecuteParams<GetLessonRequest> => ({
    request: { id: input.id, locale: input.locale },
    principal: toPrincipal(identity),
})

/** Maps the public projection to its GraphQL type; the domain already built the allowlist, the schema lists the fields. */
export const toLessonType = (result: LessonView): LessonType => result
