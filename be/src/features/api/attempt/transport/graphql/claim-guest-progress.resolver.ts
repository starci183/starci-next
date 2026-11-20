import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ClaimGuestProgressCommand } from "../../application/claim-guest-progress.command"
import { ClaimGuestProgressInput } from "./dto/claim-guest-progress.input"
import { ClaimGuestProgressType } from "./dto/claim-guest-progress.type"
import { toClaimGuestProgressParams } from "./guest-progress.mapper"

@Resolver()
/** GraphQL door that merges what a guest did on the device into the account that just signed in; it needs a session. */
export class ClaimGuestProgressResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Grades the answers again, marks the sections the learner may read, and leaves anything already there alone; idempotent. */
    @Mutation(() => ClaimGuestProgressType, { name: "claimGuestProgress" })
    async claimGuestProgress(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ClaimGuestProgressInput,
    ): Promise<ClaimGuestProgressType> {
        return this.commandBus.execute(new ClaimGuestProgressCommand(toClaimGuestProgressParams(identity, input)))
    }
}
