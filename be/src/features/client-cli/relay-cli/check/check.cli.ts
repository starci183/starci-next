import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay check`. */
export interface CheckLessonOptions {
    /** One scenario id, or undefined for all. */
    readonly scenario?: string | undefined
    /** Whether the learner already agreed to run the shown commands. */
    readonly yes: boolean
}

@Command({
    name: "check",
    arguments: "<lesson>",
    description: "Run the signed scenarios of a lesson here and send one practice result per scenario",
})
/** `starci-relay check`: delegates to the learner's relay client once. */
export class CheckCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--scenario`: check this scenario only. */
    @Option({ flags: "--scenario <id>", description: "Check one scenario (default: all)" })
    parseScenario(value: string): string {
        return value
    }

    /** `--yes`: run the shown commands without asking. */
    @Option({ flags: "--yes", description: "Run the shown commands without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** Checks the lesson named by the first argument. */
    async run(passed: Array<string>, options: CheckLessonOptions): Promise<void> {
        await this.relay.lessonRun(passed[0] ?? "", { scenario: options.scenario, guards: [], yes: options.yes }, true)
    }
}
