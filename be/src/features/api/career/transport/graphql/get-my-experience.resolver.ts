import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetMyExperienceQuery } from "../../application/get-my-experience.query"
import { MyExperienceInput } from "./dto/my-experience.input"
import { MyExperienceType } from "./dto/my-experience.type"
import { toGetMyExperienceParams, toGetMyExperienceType } from "./get-my-experience.mapper"

@Resolver()
/** GraphQL door of the learner's own experience items (Experience); it needs a session and no Premium. */
export class GetMyExperienceResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the items of the learner, newest change first, with the verified count the hiring bridge needs. */
    @Query(() => MyExperienceType, { name: "myExperience" })
    async myExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: MyExperienceInput,
    ): Promise<MyExperienceType> {
        const result = await this.queryBus.execute(new GetMyExperienceQuery(toGetMyExperienceParams(identity, input)))
        return toGetMyExperienceType(result)
    }
}
