import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ExplainProjectConceptCommand } from "../../application/explain-project-concept.command"
import { ExplainProjectConceptInput } from "./dto/explain-project-concept.input"
import { ProjectConceptType } from "./dto/project-concept.type"
import { toExplainProjectConceptParams, toExplainProjectConceptType } from "./explain-project-concept.mapper"

@Resolver()
/** GraphQL door: has the ai teacher read the code a concept points to and the learner's explanation; it needs premium; it needs a session. */
export class ExplainProjectConceptResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Has the AI teacher read the code a concept points to and the learner's explanation; it needs Premium. */
    @Mutation(() => ProjectConceptType, { name: "explainProjectConcept" })
    async explainProjectConcept(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ExplainProjectConceptInput,
    ): Promise<ProjectConceptType> {
        const result = await this.commandBus.execute(
            new ExplainProjectConceptCommand(toExplainProjectConceptParams(identity, input)),
        )
        return toExplainProjectConceptType(result)
    }
}
