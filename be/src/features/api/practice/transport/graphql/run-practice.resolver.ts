import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RunPracticeCommand } from "../../application/run-practice.command"
import { PracticeSolveInput } from "./dto/practice-solve.input"
import { PracticeSubmissionType } from "./dto/practice-submission.type"
import { toRunPracticeParams } from "./run-practice.mapper"
import { toPracticeSubmissionType } from "./practice-view.mapper"

@Resolver()
/** GraphQL door of running a solution against the example; it needs a session, and Premium beyond the free problems of a pattern. */
export class RunPracticeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Runs the solution against the public example; it counts for nothing. */
    @Mutation(() => PracticeSubmissionType, { name: "runPractice" })
    async runPractice(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PracticeSolveInput,
    ): Promise<PracticeSubmissionType> {
        const result = await this.commandBus.execute(new RunPracticeCommand(toRunPracticeParams(identity, input)))
        return toPracticeSubmissionType(result)
    }
}
