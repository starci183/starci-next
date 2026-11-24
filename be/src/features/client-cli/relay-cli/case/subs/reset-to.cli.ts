import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({
    name: "reset-to",
    arguments: "<id>",
    description: "When stuck: save your work on the branch cua-toi-luu-<id>, then commit the reference rung's version of the file you edit",
})
/** `starci-relay case reset-to <id>`: delegates to the learner relay client once. */
export class CaseResetToCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Resets to the reference rung through the relay client. */
    async run(passed: Array<string>): Promise<void> {
        await this.relay.caseResetTo(passed[0] ?? "")
    }
}
