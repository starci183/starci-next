import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListProvedProjectConceptsQuery } from "../../application/list-proved-project-concepts.query"
import { ProjectProvedConceptType } from "./dto/project-proved-concept.type"
import {
    toListProvedProjectConceptsParams,
    toListProvedProjectConceptsType,
} from "./list-proved-project-concepts.mapper"

@Resolver()
/** GraphQL door: lists the concepts the signed-in learner proved in any project; it needs a session. */
export class ListProvedProjectConceptsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the concepts the signed-in learner proved in any project. */
    @Query(() => [ProjectProvedConceptType], { name: "provedProjectConcepts" })
    async provedProjectConcepts(
        @CurrentPrincipal() identity: IdentityPrincipal,
    ): Promise<ReadonlyArray<ProjectProvedConceptType>> {
        const result = await this.queryBus.execute(
            new ListProvedProjectConceptsQuery(toListProvedProjectConceptsParams(identity)),
        )
        return toListProvedProjectConceptsType(result)
    }
}
