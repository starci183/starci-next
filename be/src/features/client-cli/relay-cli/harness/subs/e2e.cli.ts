import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next harness e2e`. */
export interface HarnessE2eCliOptions {
    /** The stage to run: its number or its id. */
    readonly stage?: string | undefined
    /** Whether to run the signed install command first. */
    readonly install: boolean
    /** Whether the learner already agreed to run the shown commands. */
    readonly yes: boolean
}

@Command({
    name: "e2e",
    arguments: "[build]",
    description:
        "Run the build's signed e2e here with your own key, print the stage table and send the results (practice)",
})
/** `starci-next harness e2e [build] [--stage n]`: delegates to the learner's relay client once. */
export class HarnessE2eCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--stage`: run this stage only (its number from 1, or its id). */
    @Option({ flags: "--stage <n>", description: "Run one stage (its number from 1, or its id); default: all" })
    parseStage(value: string): string {
        return value
    }

    /** `--install`: run the build's install command first. */
    @Option({ flags: "--install", description: "Run the build's signed install command first", defaultValue: false })
    parseInstall(): boolean {
        return true
    }

    /** `--yes`: run the shown commands without asking. */
    @Option({ flags: "--yes", description: "Run the shown commands without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** Runs the e2e of the build named by the first argument, or of the build in the current folder. */
    async run(passed: Array<string>, options: HarnessE2eCliOptions): Promise<void> {
        await this.relay.harnessE2e(passed[0], {
            stage: options.stage,
            install: options.install,
            yes: options.yes,
        })
    }
}
