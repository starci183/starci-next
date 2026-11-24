import { CommandHandler } from "@nestjs/cqrs"
import { RelayDeviceService, type RelayPairCode } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { IssueRelayPairCodeCommand } from "./issue-relay-pair-code.command"

@CommandHandler(IssueRelayPairCodeCommand)
/** Issues the learner's six-digit pairing code, one live at a time. One relay-service call. */
export class IssueRelayPairCodeHandler extends ICQRSHandler<IssueRelayPairCodeCommand, RelayPairCode> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly devices: RelayDeviceService,
    ) {
        super(logger)
    }

    protected override process(command: IssueRelayPairCodeCommand): Promise<RelayPairCode> {
        return this.devices.issuePairCode(command.params.principal.id)
    }
}
