import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { CheckReviewClozeCommand } from "../../application/check-review-cloze.command"
import { CheckRecallClozeInput } from "./dto/check-recall-cloze.input"
import { RecallClozeResultType } from "./dto/recall-cloze-result.type"
import { toCheckReviewClozeParams } from "./check-review-cloze.mapper"

@Resolver()
/** GraphQL door checkReviewCloze; it needs a session. */
export class CheckReviewClozeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Checks a picked choice against the hidden term; answers correct or not. */
    @Mutation(() => RecallClozeResultType, { name: "checkReviewCloze" })
    checkReviewCloze(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: CheckRecallClozeInput,
    ): Promise<RecallClozeResultType> {
        return this.commandBus.execute(new CheckReviewClozeCommand(toCheckReviewClozeParams(identity, input)))
    }
}
