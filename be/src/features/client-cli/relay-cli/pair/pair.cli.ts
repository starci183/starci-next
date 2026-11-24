import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "pair",
    arguments: "<code>",
    description: "Pair this machine with your StarCi account using the six-digit code from the Devices page",
})
/** `starci-relay pair <code>`: delegates to the learner's relay client once. */
export class PairCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Pair this machine with the six-digit code the learner got on the web (typed with spaces, it arrives as several arguments). */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.pair(passed.join(" "))
    }
}
