import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay harness doctor`, as the flags give them. */
export interface DoctorCliOptions {
    /** claude or codex; both when absent. */
    readonly tool?: string
    /** A starci-next-data checkout. */
    readonly from?: string
    /** Run the shown commands without asking. */
    readonly yes: boolean
    /** Print JSON lines. */
    readonly json: boolean
    /** False with `--no-upload`: keep the result here. */
    readonly upload: boolean
    /** vi or en. */
    readonly lang?: string
}

@Command({
    name: "doctor",
    description: "Run the doctor probes of the harness content against this machine and the project in this folder",
})
/** `starci-relay harness doctor`: delegates to the learner relay client once. */
export class DoctorCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--tool`: one tool. */
    @Option({ flags: "--tool <tool>", description: "claude or codex (both when not given)" })
    parseTool(value: string): string {
        return value
    }

    /** `--from <dir>`: a content checkout. */
    @Option({ flags: "--from <dir>", description: "A starci-next-data checkout to read the probes from" })
    parseFrom(value: string): string {
        return value
    }

    /** `--yes`: do not ask. */
    @Option({ flags: "--yes", description: "Run the shown commands without asking", defaultValue: false })
    parseYes(): boolean {
        return true
    }

    /** `--json`: machine output. */
    @Option({ flags: "--json", description: "Print one JSON result per tool instead of text", defaultValue: false })
    parseJson(): boolean {
        return true
    }

    /** `--no-upload`: keep the result here. */
    @Option({ flags: "--no-upload", description: "Do not send the result to StarCi" })
    parseNoUpload(): boolean {
        return false
    }

    /** `--lang`: the language of labels and hints. */
    @Option({ flags: "--lang <lang>", description: "vi or en (default en)" })
    parseLang(value: string): string {
        return value
    }

    /** Runs the probes. */
    async run(_passed: Array<string>, options: DoctorCliOptions): Promise<void> {
        await this.relay.harnessDoctor({
            tool: options.tool,
            from: options.from,
            yes: options.yes,
            json: options.json,
            noUpload: options.upload === false,
            lang: options.lang,
        })
    }
}
