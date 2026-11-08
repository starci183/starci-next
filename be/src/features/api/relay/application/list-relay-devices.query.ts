import { Query } from "@nestjs/cqrs"
import type { RelayDevice } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListRelayDevicesRequest } from "./list-relay-devices.contracts"

/** Lists the signed-in learner's paired devices. */
export class ListRelayDevicesQuery extends Query<ReadonlyArray<RelayDevice>> {
    constructor(readonly params: ExecuteParams<ListRelayDevicesRequest>) {
        super()
    }
}
