import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "devices", description: "Where to see and revoke your paired devices" })
/** `starci-next devices`: delegates to the learner's relay client once. */
export class DevicesCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Where to see and revoke your paired devices. */
    run(): Promise<void> {
        return this.relay.devices()
    }
}
