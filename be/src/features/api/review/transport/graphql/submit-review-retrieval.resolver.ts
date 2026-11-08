import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitReviewRetrievalCommand } from "../../application/submit-review-retrieval.command"
import { SubmitRecallRetrievalInput } from "./dto/submit-recall-retrieval.input"
import { RecallFlipType } from "./dto/recall-flip.type"
import { toSubmitReviewRetrievalParams } from "./submit-review-retrieval.mapper"

@Resolver()
/** GraphQL door submitReviewRetrieval; it needs a session. */
export class SubmitReviewRetrievalResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the written answer to a retrieval item, then shows the sample answer. */
    @Mutation(() => RecallFlipType, { name: "submitReviewRetrieval" })
    submitReviewRetrieval(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SubmitRecallRetrievalInput,
    ): Promise<RecallFlipType> {
        return this.commandBus.execute(new SubmitReviewRetrievalCommand(toSubmitReviewRetrievalParams(identity, input)))
    }
}
