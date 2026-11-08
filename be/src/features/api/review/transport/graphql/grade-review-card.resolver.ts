import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { GradeReviewCardCommand } from "../../application/grade-review-card.command"
import { GradeRecallCardInput } from "./dto/grade-recall-card.input"
import { RecallGradeType } from "./dto/recall-grade.type"
import { toGradeReviewCardParams } from "./grade-review-card.mapper"

@Resolver()
/** GraphQL door gradeReviewCard; it needs a session. */
export class GradeReviewCardResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the self-grade of a revealed item and schedules its next review. */
    @Mutation(() => RecallGradeType, { name: "gradeReviewCard" })
    gradeReviewCard(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: GradeRecallCardInput,
    ): Promise<RecallGradeType> {
        return this.commandBus.execute(new GradeReviewCardCommand(toGradeReviewCardParams(identity, input)))
    }
}
