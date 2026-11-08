import { QueryHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type PairingPreview } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetRelayPairingQuery } from "./get-relay-pairing.query"

@QueryHandler(GetRelayPairingQuery)
/** Reads what the learner confirms: the device name and platform of a pending pairing. One relay-service call. */
export class GetRelayPairingHandler extends ICQRSHandler<GetRelayPairingQuery, PairingPreview> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(query: GetRelayPairingQuery): Promise<PairingPreview> {
        return this.devices.preview(query.params.request.userCode)
    }
}
