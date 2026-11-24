import { Args, Mutation, Query, Resolver } from "@nestjs/graphql"
import type { CommandBus, QueryBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus, InjectQueryBus } from "@modules/platform/cqrs"
import { GetCourseRungQuery } from "../../application/get-course-rung.query"
import { ResetCourseRungCommand } from "../../application/reset-course-rung.command"
import { RelayLabCaseResetInput } from "./dto/relay-lab-case.input"
import { RelayLabRungInput } from "./dto/relay-lab-rung.input"
import { RelayLabRungType } from "./dto/relay-lab-rung.type"
import { toCaseResetParams } from "./relay-lab-case.mapper"

@Resolver()
/**
 * The rung doors of a paired device (bearer device token). The learner's checkout holds only the base rung of the ladder; these doors
 * hand out one rung of the learner file at a time: the diff once StarCi recorded the case green, the reset at any time, recorded.
 */
export class RelayLabRungResolver {
    constructor(
        @InjectQueryBus() private readonly queryBus: QueryBus,
        @InjectCommandBus() private readonly commandBus: CommandBus,
    ) {}

    /** One rung of a case's reference diff: the rung before its fix or its own rung. */
    @Query(() => RelayLabRungType, {
        name: "relayLabRung",
        description:
            "One rung (rung:<tag>) of the learner file for a case's reference diff: the case's own rung or the one before it, only once StarCi recorded the case green for this learner. COURSE_RUNG_LOCKED, COURSE_RUNG_NOT_FOUND, COURSE_CASE_NOT_FOUND, COURSE_LESSON_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    @Credential({ kind: "tool-token" })
    async relayLabRung(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabRungInput,
    ): Promise<RelayLabRungType> {
        return this.queryBus.execute(
            new GetCourseRungQuery({
                request: {
                    learnerId: credential.workspaceId,
                    lessonId: input.lessonId,
                    caseId: input.caseId,
                    tag: input.tag,
                },
            }),
        )
    }

    /** Records a reset of a case (the `case.reset` upload, same input) and answers the case's own rung. */
    @Mutation(() => RelayLabRungType, {
        name: "relayLabCaseResetTo",
        description:
            "Resets a case to its reference rung: records the case.reset (the learner's own work kept on stashedBranch) and answers that rung (rung:<tag>) of the learner file. Always allowed. COURSE_RUNG_NOT_FOUND, COURSE_CASE_NOT_FOUND, COURSE_PAYLOAD_INVALID, COURSE_LESSON_NOT_FOUND, COURSE_PREMIUM_REQUIRED.",
    })
    @Credential({ kind: "tool-token" })
    async relayLabCaseResetTo(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabCaseResetInput,
    ): Promise<RelayLabRungType> {
        const { request } = toCaseResetParams(credential, input)
        return this.commandBus.execute(
            new ResetCourseRungCommand({ request: { learnerId: request.learnerId, input: request.input } }),
        )
    }
}
