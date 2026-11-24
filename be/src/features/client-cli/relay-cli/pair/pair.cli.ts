import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "pair",
    arguments: "<code>",
    description: "Pair this machine with your StarCi account using the code from the Devices page",
})
/** `starci-relay pair <code>`: delegates to the learner's relay client once. */
export class PairCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Pair this machine with the code the learner copied from the web. */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.pair(passed[0] ?? "")
    }
}
