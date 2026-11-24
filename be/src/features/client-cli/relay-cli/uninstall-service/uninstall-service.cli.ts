import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "uninstall-service", description: "Stop Relay and remove its auto-start from this machine" })
/** `starci-relay uninstall-service`: delegates to the learner's relay client once. */
export class UninstallServiceCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Turns the auto-start off. */
    run(): Promise<void> {
        return this.relay.uninstallService()
    }
}
