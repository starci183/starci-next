import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetMyProfileQuery } from "../../application/get-my-profile.query"
import { ProfileInput } from "./dto/profile.input"
import { ProfileType } from "./dto/profile.type"
import { toProfileParams, toProfileType } from "./profile.mapper"

@Resolver()
/** GraphQL door of the profile: the name, the avatar address, the goal and the avatar limits; it needs a session and no Premium. */
export class GetMyProfileResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the profile of the learner who asks. */
    @Query(() => ProfileType, { name: "myProfile" })
    async myProfile(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ProfileInput,
    ): Promise<ProfileType> {
        return toProfileType(await this.queryBus.execute(new GetMyProfileQuery(toProfileParams(identity, input))))
    }
}
