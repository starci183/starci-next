import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetExperienceReviewersQuery } from "../../application/get-experience-reviewers.query"
import { ReviewerType } from "./dto/reviewer.type"
import { toGetExperienceReviewersParams, toGetExperienceReviewersType } from "./get-experience-reviewers.mapper"

@Resolver()
/** GraphQL door of the reviewer appointments (Reviewers); it needs a session with role TEACHER. */
export class GetExperienceReviewersResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the active appointments with their open items. */
    @Query(() => [ReviewerType], { name: "experienceReviewers" })
    async experienceReviewers(@CurrentPrincipal() identity: IdentityPrincipal): Promise<Array<ReviewerType>> {
        const result = await this.queryBus.execute(
            new GetExperienceReviewersQuery(toGetExperienceReviewersParams(identity)),
        )
        return toGetExperienceReviewersType(result)
    }
}
