import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SubmitPracticeCommand } from "../../application/submit-practice.command"
import { PracticeSolveInput } from "./dto/practice-solve.input"
import { PracticeSubmissionType } from "./dto/practice-submission.type"
import { toSubmitPracticeParams } from "./submit-practice.mapper"
import { toPracticeSubmissionType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of submitting a solution against every test; it needs a session, and Premium beyond the free problems of a pattern. */
export class SubmitPracticeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Submits the solution against every test. */
    @Mutation(() => PracticeSubmissionType, { name: "submitPractice" })
    async submitPractice(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeSolveInput,
    ): Promise<PracticeSubmissionType> {
        const result = await this.commandBus.execute(new SubmitPracticeCommand(toSubmitPracticeParams(identity, input)))
        return toPracticeSubmissionType(result)
    }
}
