import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay install-service`. */
export interface InstallServiceOptions {
    /** Skip the question before the relay starts by itself. */
    readonly yes: boolean
}

@Command({
    name: "install-service",
    description: "Start Relay by itself when you log in to this machine (user level, no admin right)",
})
/** `starci-relay install-service [--yes]`: delegates to the learner's relay client once. */
export class InstallServiceCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `-y, --yes`: do not ask. */
    @Option({ flags: "-y, --yes", description: "Do not ask before turning on the auto-start", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** Turns the auto-start on. */
    run(_passed: Array<string>, options: InstallServiceOptions): Promise<void> {
        return this.relay.installService(options.yes)
    }
}
