import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { UploadRelayEventCommand } from "../../application/upload-relay-event.command"
import { RelayLabTestsInput } from "./dto/relay-lab-event.input"
import { RelayUploadType } from "./dto/relay-upload.type"
import { toLabTestsParams, toRelayUploadType } from "./relay-feed.mapper"

@Resolver()
/** GraphQL upload door relayLabTests for a paired device (bearer device token); idempotent per client event id. */
export class RelayLabTestsResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Records one run of the visible tests of the lab. */
    @Mutation(() => RelayUploadType, { name: "relayLabTests" })
    @Credential({ kind: "tool-token" })
    async relayLabTests(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RelayLabTestsInput,
    ): Promise<RelayUploadType> {
        const result = await this.commandBus.execute(new UploadRelayEventCommand(toLabTestsParams(credential, input)))
        return toRelayUploadType(result)
    }
}
