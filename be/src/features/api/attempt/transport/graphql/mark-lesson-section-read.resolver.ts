import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { MarkLessonSectionReadCommand } from "../../application/mark-lesson-section-read.command"
import { MarkLessonSectionReadInput } from "./dto/mark-lesson-section-read.input"

@Resolver()
/** GraphQL door that marks an article section as read, which clears its "nên đọc kỹ" mark; it needs a session. */
export class MarkLessonSectionReadResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records the section as read and answers every section the learner marked in the lesson; idempotent. */
    @Mutation(() => [String], { name: "markLessonSectionRead" })
    async markLessonSectionRead(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: MarkLessonSectionReadInput,
    ): Promise<ReadonlyArray<string>> {
        return this.commandBus.execute(
            new MarkLessonSectionReadCommand({
                request: { lessonId: input.lessonId, sectionId: input.sectionId },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
