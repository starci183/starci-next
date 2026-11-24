import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayLabFilesInput } from "./dto/relay-lab-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toLabFilesParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayLabFiles for a paired device (bearer device token); idempotent per client event id. */
export class RelayLabFilesResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records the learner's files of the lab at a commit. */
    @Mutation(() => RelayUploadType, { name: "relayLabFiles" })
    @Credential({ kind: "tool-token" })
    async relayLabFiles(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabFilesInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(new UploadRelayEventCommand(toLabFilesParams(credential, input)))
        return toRelayUploadType(result)
    }
}
