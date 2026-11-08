import { Args, Int, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { MarkNotificationsReadCommand } from "../../application/mark-notifications-read.command"
import { MarkNotificationsReadInput } from "./dto/mark-notifications-read.input"
import { toMarkNotificationsReadParams } from "./mark-notifications-read.mapper"

@Resolver()
/** GraphQL door of markNotificationsRead: a signed-in learner marks their own notifications read. */
export class MarkNotificationsReadResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Marks the named notifications, or all, of the caller read and answers how many changed. */
    @Mutation(() => Int, { name: "markNotificationsRead" })
    markNotificationsRead(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: MarkNotificationsReadInput,
    ): Promise<number> {
        return this.commandBus.execute(new MarkNotificationsReadCommand(toMarkNotificationsReadParams(identity, input)))
    }
}
