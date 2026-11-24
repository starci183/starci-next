import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { Credential, CurrentCredential, type CredentialPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RegisterRelayDeviceKeyCommand } from "../../application/register-relay-device-key.command"
import { RegisterRelayDeviceKeyInput } from "./dto/relay-pair-code.input"
import { RelayDeviceKeyType } from "./dto/relay-pair-code.type"

@Resolver()
/** GraphQL door of registerRelayDeviceKey for a paired device (bearer device token). */
export class RegisterRelayDeviceKeyResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Registers the Ed25519 public key the device signs grading results with; once per device, a new key needs a new pairing. */
    @Mutation(() => RelayDeviceKeyType, { name: "registerRelayDeviceKey" })
    @Credential({ kind: "tool-token" })
    async registerRelayDeviceKey(
        @CurrentCredential() credential: CredentialPrincipal,
        @Args("input") input: RegisterRelayDeviceKeyInput,
    ): Promise<RelayDeviceKeyType> {
        return this.commandBus.execute(
            new RegisterRelayDeviceKeyCommand({
                request: {
                    device: { learnerId: credential.workspaceId, deviceId: credential.subject },
                    publicKey: input.publicKey,
                },
            }),
        )
    }
}
