import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { ConfirmRelayDeviceCommand } from "../../application/confirm-relay-device.command"
import { toConfirmRelayDeviceParams, toRelayDeviceType } from "./relay-device.mapper"
import { RelayUserCodeInput } from "./dto/relay-user-code.input"
import { RelayDeviceType } from "./dto/relay-device.type"

@Resolver()
/** GraphQL door of confirmRelayDevice for the signed-in learner. */
export class ConfirmRelayDeviceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Confirms the pairing for the caller; the CLI then takes its own token. */
    @Mutation(() => RelayDeviceType, { name: "confirmRelayDevice" })
    async confirmRelayDevice(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RelayUserCodeInput,
    ): Promise<RelayDeviceType> {
        const result = await this.commandBus.execute(
            new ConfirmRelayDeviceCommand(toConfirmRelayDeviceParams(identity, input)),
        )
        return toRelayDeviceType(result)
    }
}
