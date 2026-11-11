import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "status", description: "Show where StarCi is and whether this machine is paired" })
/** `starci-next status`: delegates to the learner's relay client once. */
export class StatusCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Show where StarCi is and whether this machine is paired. */
    run(): Promise<void> {
        return this.relay.status()
    }
}
