import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next run`. */
export interface RunTaskOptions {
    /** Whether the learner already agreed to run the shown commands. */
    readonly yes: boolean
    /** The lesson scenario to run. */
    readonly scenario?: string | undefined
    /** The `name=off` guards to turn off, repeatable. */
    readonly guard?: ReadonlyArray<string> | undefined
    /** The challenge tier whose hidden scenarios to run. */
    readonly challenge?: string | undefined
}

@Command({
    name: "run",
    arguments: "<milestone>",
    description:
        "Run the StarCi-signed checks of a milestone (or task), or one scenario / challenge of a lesson, here and send the results (practice)",
})
/** `starci-next run <task> [--yes]` or `run <lesson> --scenario <id> [--guard n=off] | --challenge <tier>`: delegates to the learner's relay client once. */
export class RunTaskCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--yes`: run the shown commands without asking. */
    @Option({ flags: "--yes", description: "Run the shown commands without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** `--scenario`: the lesson scenario to run. */
    @Option({ flags: "--scenario <id>", description: "Run one scenario of a lesson" })
    parseScenario(value: string): string {
        return value
    }

    /** `--guard name=off`: turn a scenario guard off to see the red path; repeatable. */
    @Option({ flags: "--guard <guard>", description: "Turn a guard off, as name=off (repeatable)" })
    parseGuard(value: string, previous: ReadonlyArray<string> = []): ReadonlyArray<string> {
        return [...previous, value]
    }

    /** `--challenge`: run the hidden scenarios of a tier. */
    @Option({
        flags: "--challenge <tier>",
        description: "Run the hidden scenarios of a tier (easy, medium, hard, insane)",
    })
    parseChallenge(value: string): string {
        return value
    }

    /** Runs the task, or the scenario or challenge of the lesson, named by the first argument. */
    async run(passed: Array<string>, options: RunTaskOptions): Promise<void> {
        if (options.scenario !== undefined || options.challenge !== undefined) {
            await this.relay.lessonRun(
                passed[0] ?? "",
                {
                    scenario: options.scenario,
                    guards: options.guard ?? [],
                    challenge: options.challenge,
                    yes: options.yes,
                },
                false,
            )
            return
        }
        await this.relay.run(passed, options.yes)
    }
}
