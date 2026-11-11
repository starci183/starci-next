import { Command, CommandRunner } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

@Command({ name: "logout", description: "Forget this machine's device token" })
/** `starci-next logout`: delegates to the learner's relay client once. */
export class LogoutCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** Forget this machine's device token. */
    run(): Promise<void> {
        return this.relay.logout()
    }
}
