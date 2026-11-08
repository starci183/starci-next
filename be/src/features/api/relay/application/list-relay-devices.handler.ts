import { QueryHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type RelayDevice } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListRelayDevicesQuery } from "./list-relay-devices.query"

@QueryHandler(ListRelayDevicesQuery)
/** Lists the signed-in learner's paired devices. One relay-service call. */
export class ListRelayDevicesHandler extends ICQRSHandler<ListRelayDevicesQuery, ReadonlyArray<RelayDevice>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(query: ListRelayDevicesQuery): Promise<ReadonlyArray<RelayDevice>> {
        return this.devices.devices(query.params.principal.id)
    }
}
