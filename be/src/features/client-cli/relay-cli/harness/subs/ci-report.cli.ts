import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay harness ci-report`. */
export interface HarnessCiReportCliOptions {
    /** The JUnit report to read. */
    readonly report?: string | undefined
    /** The stage to report: its number or its id. */
    readonly stage?: string | undefined
}

@Command({
    name: "ci-report",
    description: "In GitHub Actions: send the e2e report of the build, signed and attested by the run's OIDC token",
})
/** `starci-relay harness ci-report`: delegates to the learner's relay client once. */
export class HarnessCiReportCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--report`: the JUnit report path; the one the build marker names by default. */
    @Option({ flags: "--report <path>", description: "The JUnit report to read (default: the build's own)" })
    parseReport(value: string): string {
        return value
    }

    /** `--stage`: report this stage only. */
    @Option({ flags: "--stage <n>", description: "Report one stage (its number from 1, or its id); default: all" })
    parseStage(value: string): string {
        return value
    }

    /** Posts the run's harness lines. */
    async run(_passed: Array<string>, options: HarnessCiReportCliOptions): Promise<void> {
        await this.relay.harnessCiReport({ report: options.report, stage: options.stage })
    }
}
