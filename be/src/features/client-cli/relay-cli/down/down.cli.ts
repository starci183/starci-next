import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "down",
    description: "Stop the pulled lesson's docker compose",
})
/** `starci-next down`: delegates to the learner's relay client once. */
export class DownCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Stops the containers. */
    async run(): Promise<void> {
        await this.relay.compose("down")
    }
}
