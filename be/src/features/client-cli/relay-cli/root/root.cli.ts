import { CommandRunner, Option, RootCommand } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of a bare `starci-relay`. */
export interface RootCommandOptions {
    /** Print the version and stop. */
    readonly version: boolean
}

@RootCommand({ description: "StarCi Relay: runs your StarCi labs and scenarios on this machine" })
/** `starci-relay [--version]`: delegates to the learner's relay client once. */
export class RootCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `-v, --version`: print the package version. */
    @Option({ flags: "-v, --version", description: "Print the version", defaultValue: false })
    parseVersion(): boolean {
        return true
    }

    /** Prints the version, or the way to the help. */
    run(_passed: Array<string>, options: RootCommandOptions): Promise<void> {
        return this.relay.root(options.version)
    }
}
