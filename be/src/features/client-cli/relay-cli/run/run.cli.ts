import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next run`. */
export interface RunTaskOptions {
    /** Whether the learner already agreed to run the shown commands. */
    readonly yes: boolean
}

@Command({
    name: "run",
    arguments: "<milestone>",
    description: "Run the StarCi-signed checks of a milestone (or task) here and send the results (practice)",
})
/** `starci-next run <task> [--yes]`: delegates to the learner's relay client once. */
export class RunTaskCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--yes`: run the shown commands without asking. */
    @Option({ flags: "--yes", description: "Run the shown commands without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** Runs the task named by the first argument. */
    async run(passed: Array<string>, options: RunTaskOptions): Promise<void> {
        await this.relay.run(passed, options.yes)
    }
}
