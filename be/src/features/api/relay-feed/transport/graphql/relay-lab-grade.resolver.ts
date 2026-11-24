import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayLabGradeInput } from "./dto/relay-lab-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toLabGradeParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayLabGrade for a paired device (bearer device token); idempotent per client event id. */
export class RelayLabGradeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records the signed result of a grading run; the relay verifies it before the submission counts. */
    @Mutation(() => RelayUploadType, { name: "relayLabGrade" })
    @Credential({ kind: "tool-token" })
    async relayLabGrade(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabGradeInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(new UploadRelayEventCommand(toLabGradeParams(credential, input)))
        return toRelayUploadType(result)
    }
}
