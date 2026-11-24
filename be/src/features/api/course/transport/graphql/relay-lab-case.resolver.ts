import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadCourseCaseCommand } from "../../application/upload-course-case.command"
import { CourseCaseUploadType } from "./dto/course-case-upload.type"
import { RelayLabCaseHintInput, RelayLabCaseResetInput, RelayLabCaseResultInput } from "./dto/relay-lab-case.input"
import { toCaseHintParams, toCaseResetParams, toCaseResultParams } from "./relay-lab-case.mapper"

@Resolver()
/** The case upload doors of a paired device (bearer device token): `case.result`, `case.hint` and `case.reset` of the relay protocol, idempotent per client event id. */
export class RelayLabCaseResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores one run of a case on the learner's machine. */
    @Mutation(() => CourseCaseUploadType, { name: "relayLabCaseResult" })
    @Credential({ kind: "tool-token" })
    async relayLabCaseResult(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabCaseResultInput,
    ): Promise<CourseCaseUploadType> {
        return this.commandBus.execute(new UploadCourseCaseCommand(toCaseResultParams(credential, input)))
    }

    /** Stores one hint level the learner opened. */
    @Mutation(() => CourseCaseUploadType, { name: "relayLabCaseHint" })
    @Credential({ kind: "tool-token" })
    async relayLabCaseHint(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabCaseHintInput,
    ): Promise<CourseCaseUploadType> {
        return this.commandBus.execute(new UploadCourseCaseCommand(toCaseHintParams(credential, input)))
    }

    /** Stores one reset of the learner file to a case's reference step. */
    @Mutation(() => CourseCaseUploadType, { name: "relayLabCaseReset" })
    @Credential({ kind: "tool-token" })
    async relayLabCaseReset(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabCaseResetInput,
    ): Promise<CourseCaseUploadType> {
        return this.commandBus.execute(new UploadCourseCaseCommand(toCaseResetParams(credential, input)))
    }
}
