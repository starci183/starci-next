import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "diff",
    arguments: "<id>",
    description: "Once a case is green: the reference fix of that case on the file you edit",
})
/** `starci-relay case diff <id>`: delegates to the learner relay client once. */
export class CaseDiffCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Shows the reference diff through the relay client. */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.caseDiff(passed[0] ?? "")
    }
}
