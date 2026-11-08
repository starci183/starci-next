import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { LessonCatalogItemView } from "@modules/domain/lesson"
import type { ListLessonsRequest } from "../../application/list-lessons.contracts"
import type { LessonCatalogItemType } from "./dto/lesson-catalog-item.type"
import type { LessonsInput } from "./dto/lessons.input"

/** Maps the catalog input and the session to the message params. */
export const toListLessonsParams = (
    identity: IdentityPrincipal,
    input: LessonsInput,
): ExecuteParams<ListLessonsRequest> => ({
    request: {
        locale: input.locale,
        group: input.group,
        topic: input.topic,
        category: input.category,
        difficulty: input.difficulty,
        language: input.language,
        provider: input.provider,
        q: input.q,
    },
    principal: toPrincipal(identity),
})

/** Maps the catalog items to their GraphQL type; the schema lists every field a learner may read. */
export const toLessonCatalogItemTypes = (
    result: ReadonlyArray<LessonCatalogItemView>,
): Array<LessonCatalogItemType> => [...result]
