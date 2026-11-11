import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "login", description: "Pair this machine with your StarCi account (a code to confirm on the web)" })
/** `starci-next login`: delegates to the learner's relay client once. */
export class LoginCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Pair this machine with your StarCi account (a code to confirm on the web). */
    async run(): Promise<void> {
        await this.relay.login()
    }
}
