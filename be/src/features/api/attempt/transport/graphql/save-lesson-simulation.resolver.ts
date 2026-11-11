import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SaveLessonSimulationCommand } from "../../application/save-lesson-simulation.command"
import { LessonProgressSimulationType } from "./dto/lesson-progress-simulation.type"
import { SaveLessonSimulationInput } from "./dto/save-lesson-simulation.input"
import { toLessonProgressSimulationType, toSaveLessonSimulationParams } from "./save-lesson-simulation.mapper"

@Resolver()
/** GraphQL door that keeps where a learner stands in a simulation; it needs a session, and Premium beyond the free phase. */
export class SaveLessonSimulationResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Replays the path through the stored state machine, keeps the state, the path and the branches tried, and answers them. */
    @Mutation(() => LessonProgressSimulationType, { name: "saveLessonSimulation" })
    async saveLessonSimulation(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SaveLessonSimulationInput,
    ): Promise<LessonProgressSimulationType> {
        const result = await this.commandBus.execute(
            new SaveLessonSimulationCommand(toSaveLessonSimulationParams(identity, input)),
        )
        return toLessonProgressSimulationType(result)
    }
}
