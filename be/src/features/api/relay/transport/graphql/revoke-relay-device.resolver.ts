import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RevokeRelayDeviceCommand } from "../../application/revoke-relay-device.command"
import { toRevokeRelayDeviceParams, toRevokeRelayDeviceType } from "./relay-device.mapper"
import { RevokeRelayDeviceInput } from "./dto/revoke-relay-device.input"
import { RevokeRelayDeviceType } from "./dto/revoke-relay-device.type"

@Resolver()
/** GraphQL door of revokeRelayDevice for the signed-in learner. */
export class RevokeRelayDeviceResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Revokes one of the caller's devices; its token stops working at once. */
    @Mutation(() => RevokeRelayDeviceType, { name: "revokeRelayDevice" })
    async revokeRelayDevice(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RevokeRelayDeviceInput,
    ): Promise<RevokeRelayDeviceType> {
        const result = await this.commandBus.execute(
            new RevokeRelayDeviceCommand(toRevokeRelayDeviceParams(identity, input)),
        )
        return toRevokeRelayDeviceType(result)
    }
}
