import { CommandRunner, SubCommand } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@SubCommand({ name: "run", arguments: "<id>", description: "Run a case and every case before it" })
/** `starci-relay case run <id>`: delegates to the learner relay client once. */
export class CaseRunCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Runs the case through the relay client. */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.caseRun(passed[0] ?? "")
    }
}
