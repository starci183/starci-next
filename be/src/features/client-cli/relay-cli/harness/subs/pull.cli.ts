import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "pull",
    arguments: "<build>",
    description: "Get a harness build's source at the commit StarCi signed (a signed tarball, like a lesson pull)",
})
/** `starci-next harness pull <build>`: delegates to the learner's relay client once. */
export class HarnessPullCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Pulls the build named by the first argument. */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.harnessPull(passed[0] ?? "")
    }
}
