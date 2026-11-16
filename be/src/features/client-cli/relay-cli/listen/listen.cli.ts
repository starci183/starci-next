import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next listen`. */
export interface ListenCommandOptions {
    /** Run what StarCi asks without the y/N question. */
    readonly autoConfirm: boolean
}

@Command({
    name: "listen",
    description: "Listen for run requests from your AI (via StarCi) and run them here after you agree",
})
/** `starci-next listen [--auto-confirm]`: delegates to the learner's relay client once; it runs until stopped. */
export class ListenCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--auto-confirm`: run requests without asking. The only way to run without a terminal. */
    @Option({
        flags: "--auto-confirm",
        description: "Run requests without the y/N question (required when there is no terminal)",
        defaultValue: false,
    })
    parseAutoConfirm(): boolean {
        return true
    }

    /** Starts listening. */
    async run(_passed: Array<string>, options: ListenCommandOptions): Promise<void> {
        await this.relay.listen({ autoConfirm: options.autoConfirm })
    }
}
