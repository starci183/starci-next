import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetMyCvLinkQuery } from "../../application/get-my-cv-link.query"
import { CvLinkType } from "./dto/cv-link.type"
import { toGetMyCvLinkParams } from "./get-my-cv-link.mapper"

@Resolver()
/** GraphQL door of the CV link of the learner: the slug, the path, whether it is public and how many lines are verified. */
export class GetMyCvLinkResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the CV link of the learner who asks; the first read makes the slug. */
    @Query(() => CvLinkType, { name: "myCvLink" })
    myCvLink(@CurrentPrincipal() identity: IdentityPrincipal): Promise<CvLinkType> {
        return this.queryBus.execute(new GetMyCvLinkQuery(toGetMyCvLinkParams(identity)))
    }
}
