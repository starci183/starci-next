import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ClaimPracticeExperienceCommand } from "../../application/claim-practice-experience.command"
import { ClaimPracticeExperienceInput } from "./dto/claim-practice-experience.input"
import { ExperienceItemType } from "./dto/experience-item.type"
import { toClaimPracticeExperienceParams } from "./claim-practice-experience.mapper"

@Resolver()
/** GraphQL door of claiming the experience of a practice pattern (part practice, subject the pattern id); it needs a session. */
export class ClaimPracticeExperienceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Claims the experience of a practice pattern; refused unless every problem is Accepted and none had its solution revealed first. */
    @Mutation(() => ExperienceItemType, { name: "claimPracticeExperience" })
    claimPracticeExperience(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ClaimPracticeExperienceInput,
    ): Promise<ExperienceItemType> {
        return this.commandBus.execute(
            new ClaimPracticeExperienceCommand(toClaimPracticeExperienceParams(identity, input)),
        )
    }
}
