import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RequestLessonRunCommand } from "../../application/request-lesson-run.command"
import { LessonRunRequestedType } from "./dto/lesson-run-requested.type"
import { RequestLessonRunInput } from "./dto/request-lesson-run.input"

@Resolver()
/** GraphQL door that asks the learner's online device to run one scenario; the device asks the learner to confirm. Kịch bản needs Premium. */
export class RequestLessonRunResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Sends the signed manifest of one scenario run to the online device; the result is read back with `lessonScenarioRuns`. */
    @Mutation(() => LessonRunRequestedType, { name: "requestLessonRun" })
    async requestLessonRun(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RequestLessonRunInput,
    ): Promise<LessonRunRequestedType> {
        return this.commandBus.execute(
            new RequestLessonRunCommand({
                request: { lessonId: input.lessonId, scenarioId: input.scenarioId, guardsOff: input.guardsOff },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
