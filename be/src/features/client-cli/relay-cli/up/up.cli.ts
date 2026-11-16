import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "up",
    description: "Start the pulled lesson's docker compose",
})
/** `starci-next up`: delegates to the learner's relay client once. */
export class UpCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Starts the containers. */
    async run(): Promise<void> {
        await this.relay.compose("up")
    }
}
