import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The flags of `starci-next ci-report`. */
export interface CiReportFlags {
    /** The folder of the JUnit XML reports. */
    readonly reports?: string
    /** Whether the StarCi e2e flows run. */
    readonly e2e: boolean
    /** Seconds to wait for the service. */
    readonly wait?: number
}

@Command({
    name: "ci-report",
    description:
        "In GitHub Actions: send the JUnit results and the StarCi e2e flows to StarCi with the run's OIDC token",
})
/** `starci-next ci-report` (run as `npx @starci/next ci-report` in the kit's workflows): delegates to the relay client once. */
export class CiReportCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--reports <dir>`: where the JUnit XML is. */
    @Option({ flags: "--reports <dir>", description: "The folder of the JUnit XML reports (default starci/reports)" })
    parseReports(value: string): string {
        return value
    }

    /** `--e2e`: run the StarCi e2e flows against start.baseUrl. */
    @Option({ flags: "--e2e", description: "Run starci/e2e/*.md against start.baseUrl", defaultValue: false })
    parseE2e(): boolean {
        return true
    }

    /** `--wait <seconds>`: how long to wait for the service to answer. */
    @Option({ flags: "--wait <seconds>", description: "Seconds to wait for start.baseUrl (default 60)" })
    parseWait(value: string): number {
        return Math.min(600, Math.max(0, Number.parseInt(value, 10) || 0))
    }

    /** Sends the report. */
    async run(_passed: Array<string>, flags: CiReportFlags): Promise<void> {
        await this.relay.ciReport({
            reports: flags.reports ?? "starci/reports",
            e2e: flags.e2e,
            waitS: flags.wait ?? 60,
        })
    }
}
