import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next prompt`. */
export interface PromptLessonOptions {
    /** The scenario id, or undefined when missing. */
    readonly scenario?: string | undefined
}

@Command({
    name: "prompt",
    arguments: "<lesson>",
    description: "Print a ready-to-paste prompt that asks your AI to fix a failing scenario (no solution inside)",
})
/** `starci-next prompt`: delegates to the learner's relay client once. */
export class PromptCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--scenario`: the scenario to build the prompt for. */
    @Option({ flags: "--scenario <id>", description: "The scenario that failed" })
    parseScenario(value: string): string {
        return value
    }

    /** Prints the prompt of the lesson named by the first argument. */
    async run(passed: Array<string>, options: PromptLessonOptions): Promise<void> {
        await this.relay.prompt(passed[0] ?? "", options.scenario)
    }
}
