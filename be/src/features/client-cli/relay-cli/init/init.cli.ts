import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next init`, as the flags give them. */
export interface InitProjectOptions {
    /** A starci-next-data checkout to read the kit from. */
    readonly from?: string
    /** The StarCi project id to write into starci/project.yaml. */
    readonly project?: string
    /** typescript, java, csharp or go. */
    readonly language?: string
    /** The milestone whose e2e flows are copied; the first milestone of the app kind when absent. */
    readonly milestone?: string
    /** Whether existing files are replaced. */
    readonly force: boolean
}

@Command({
    name: "init",
    arguments: "[project]",
    description:
        "Copy the StarCi kit (starci/, the e2e flows of the current milestone and the CI workflow of the detected language) into the project in this folder",
})
/** `starci-next init`: delegates to the learner's relay client once. */
export class InitProjectCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--from <dir>`: a starci-next-data checkout. */
    @Option({ flags: "--from <dir>", description: "A starci-next-data checkout to read the kit from" })
    parseFrom(value: string): string {
        return value
    }

    /** `--project <id>`: the project id from the project page. */
    @Option({ flags: "--project <id>", description: "The StarCi project id (from the project page)" })
    parseProject(value: string): string {
        return value
    }

    /** `--milestone <id>`: the milestone whose e2e flows are copied. */
    @Option({ flags: "--milestone <id>", description: "The milestone to copy the e2e flows of (default: the first)" })
    parseMilestone(value: string): string {
        return value
    }

    /** `--language <name>`: the language of the project. */
    @Option({ flags: "--language <name>", description: "typescript, java, csharp or go (default: detected)" })
    parseLanguage(value: string): string {
        return value
    }

    /** `--force`: replace files that exist. */
    @Option({ flags: "--force", description: "Replace files that already exist", defaultValue: false })
    parseForce(): boolean {
        return true
    }

    /** Copies the kit into the project of the current folder. */
    async run(passed: Array<string>, options: InitProjectOptions): Promise<void> {
        await this.relay.init({
            from: options.from,
            project: options.project ?? passed[0],
            language: options.language,
            milestone: options.milestone,
            force: options.force,
        })
    }
}
