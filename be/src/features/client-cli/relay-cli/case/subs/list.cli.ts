import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "list", description: "Every case of the lab in teaching order, with its state in the last run" })
/** `starci-relay case list`: delegates to the learner relay client once. */
export class CaseListCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Lists the cases. */
    async run(): Promise<void> {
        await this.relay.caseList()
    }
}
