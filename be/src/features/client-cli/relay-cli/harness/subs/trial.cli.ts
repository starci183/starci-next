import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay harness trial`, as the flags give them. */
export interface TrialCliOptions {
    /** claude or codex. */
    readonly tool?: string
    /** A starci-next-data checkout. */
    readonly from?: string
    /** Run without asking. */
    readonly yes: boolean
    /** Claude only: the dollar cap. */
    readonly maxBudgetUsd?: number
    /** Claude only: the permission mode. */
    readonly permissionMode?: string
    /** False with `--no-upload`: keep the verdict here. */
    readonly upload: boolean
    /** Keep the temp folder. */
    readonly keep: boolean
}

@Command({
    name: "trial",
    arguments: "<trap>",
    description: "Run your own agent (claude or codex, headless) on a trap repo with your config and print a verdict",
})
/** `starci-relay harness trial <trap> --tool claude|codex`: delegates to the learner relay client once. */
export class TrialCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--tool`: the agent. */
    @Option({ flags: "--tool <tool>", description: "claude or codex" })
    parseTool(value: string): string {
        return value
    }

    /** `--from <dir>`: a content checkout. */
    @Option({ flags: "--from <dir>", description: "A starci-next-data checkout to read the trap from" })
    parseFrom(value: string): string {
        return value
    }

    /** `--yes`: do not ask. */
    @Option({ flags: "--yes", description: "Run without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** `--max-budget-usd`: the cap of a claude run. */
    @Option({ flags: "--max-budget-usd <usd>", description: "Claude only: the most the run may spend, in US dollars" })
    parseBudget(value: string): number {
        return Number(value)
    }

    /** `--permission-mode`: the claude mode. */
    @Option({
        flags: "--permission-mode <mode>",
        description: "Claude only: the permission mode (default acceptEdits)",
    })
    parsePermissionMode(value: string): string {
        return value
    }

    /** `--no-upload`: keep the verdict here. */
    @Option({ flags: "--no-upload", description: "Do not send the verdict to StarCi" })
    parseNoUpload(): boolean {
        return false
    }

    /** `--keep`: keep the temp repo. */
    @Option({ flags: "--keep", description: "Keep the temp repo and print where it is", defaultValue: false })
    parseKeep(): boolean {
        return true
    }

    /** Runs the trial of the trap the first argument names. */
    async run(passed: Array<string>, options: TrialCliOptions): Promise<void> {
        await this.relay.harnessTrial(passed[0] ?? "", {
            tool: options.tool,
            from: options.from,
            yes: options.yes,
            maxBudgetUsd:
                options.maxBudgetUsd !== undefined && Number.isFinite(options.maxBudgetUsd)
                    ? options.maxBudgetUsd
                    : undefined,
            permissionMode: options.permissionMode,
            noUpload: options.upload === false,
            keep: options.keep,
        })
    }
}
