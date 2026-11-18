import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RevealLessonHintCommand } from "../../application/reveal-lesson-hint.command"
import { LessonHintRevealedType } from "./dto/lesson-hint-revealed.type"
import { RevealLessonHintInput } from "./dto/reveal-lesson-hint.input"

@Resolver()
/** GraphQL door that unlocks a scenario hint before a red run and records the lesson as "có hỗ trợ"; Kịch bản needs Premium. */
export class RevealLessonHintResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Returns the hint of one scenario; idempotent. */
    @Mutation(() => LessonHintRevealedType, { name: "revealLessonHint" })
    async revealLessonHint(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevealLessonHintInput,
    ): Promise<LessonHintRevealedType> {
        return this.commandBus.execute(
            new RevealLessonHintCommand({
                request: { lessonId: input.lessonId, scenarioId: input.scenarioId, locale: input.locale },
                principal: { id: identity.subject, role: "authenticated" },
            }),
        )
    }
}
