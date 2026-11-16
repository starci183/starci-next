import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayHarnessResultInput } from "./dto/relay-harness-result.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toHarnessResultParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayHarnessResult for a paired device (bearer device token): one trial or doctor result, idempotent per client event id. */
export class RelayHarnessResultResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records a harness trial or doctor result; readiness for the learner, never proof. */
    @Mutation(() => RelayUploadType, { name: "relayHarnessResult" })
    @Credential({ kind: "tool-token" })
    async relayHarnessResult(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayHarnessResultInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(
            new UploadRelayEventCommand(toHarnessResultParams(credential, input)),
        )
        return toRelayUploadType(result)
    }
}
