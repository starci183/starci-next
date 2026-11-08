import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SyncProjectPracticeCommand } from "../../application/sync-project-practice.command"
import { SyncProjectPracticeInput } from "./dto/sync-project-practice.input"
import { ProjectDetailType } from "./dto/project-detail.type"
import { toSyncProjectPracticeParams, toSyncProjectPracticeType } from "./sync-project-practice.mapper"

@Resolver()
/** GraphQL door: pulls the results the learner machine reported over the relay (practice) into a project; it needs a session. */
export class SyncProjectPracticeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Pulls the results the learner machine reported over the relay (practice) into a project. */
    @Mutation(() => ProjectDetailType, { name: "syncProjectPractice" })
    async syncProjectPractice(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SyncProjectPracticeInput,
    ): Promise<ProjectDetailType> {
        const result = await this.commandBus.execute(
            new SyncProjectPracticeCommand(toSyncProjectPracticeParams(identity, input)),
        )
        return toSyncProjectPracticeType(result)
    }
}
