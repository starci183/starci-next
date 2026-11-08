import { Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListRelayDevicesQuery } from "../../application/list-relay-devices.query"
import { toListRelayDevicesParams, toRelayDeviceTypes } from "./relay-device.mapper"
import { RelayDeviceType } from "./dto/relay-device.type"

@Resolver()
/** GraphQL door of relayDevices for the signed-in learner. */
export class ListRelayDevicesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Lists the caller's paired devices, newest first. */
    @Query(() => [RelayDeviceType], { name: "relayDevices" })
    async relayDevices(@CurrentPrincipal() identity: IdentityPrincipal): Promise<Array<RelayDeviceType>> {
        const result = await this.queryBus.execute(new ListRelayDevicesQuery(toListRelayDevicesParams(identity)))
        return toRelayDeviceTypes(result)
    }
}
