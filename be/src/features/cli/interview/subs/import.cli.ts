import { CommandRunner, Option, SubCommand } from "nest-commander"
import { InterviewImportService } from "@modules/domain/interview"

/** The options of `cli interview import`. */
export interface ImportInterviewOptions {
    /** The data checkout root, holding `courses/` and `mock-interview-eq/`. */
    readonly dir: string
    /** The label of the source ref, used as the version of every bank imported. */
    readonly ref: string
    /** The bank ids to import, separated by commas; empty for every bank. */
    readonly only: string
    /** A second root laid out like the checkout, whose files replace or add to the checkout's. */
    readonly overlay?: string
}

@SubCommand({
    name: "import",
    description: "Import the interview banks as immutable versions and print their counts, versions and hashes",
})
/**
 * `cli interview import --dir <checkout> --ref <label> [--only <bankIds>]`: delegates to the interview import, which validates each
 * bank first, leaves an identical version alone, refuses other bytes under a stored version and logs one report line per bank
 * (never an answer). A new version waits, validated, for `cli interview publish`.
 */
export class ImportInterviewCli extends CommandRunner {
    constructor(private readonly interviews: InterviewImportService) {
        super()
    }

    /** `--dir <path>`: the data checkout root. */
    @Option({ flags: "--dir <path>", description: "The starci-lab/data checkout root", required: true })
    parseDir(value: string): string {
        return value
    }

    /** `--ref <label>`: the source ref (a git sha), the version of every bank imported. */
    @Option({ flags: "--ref <label>", description: "The source ref, used as the version", required: true })
    parseRef(value: string): string {
        return value
    }

    /** `--only <bankIds>`: a comma-separated list of bank ids. */
    @Option({
        flags: "--only <bankIds>",
        description: "Comma-separated bank ids to import (default: every bank)",
        defaultValue: "",
    })
    parseOnly(value: string): string {
        return value
    }

    /** `--overlay <path>`: a second root (the content repository's `interview/overlay`) merged over the checkout. */
    @Option({ flags: "--overlay <path>", description: "A second root laid out like the checkout, merged over it" })
    parseOverlay(value: string): string {
        return value
    }

    /** Imports the banks and logs the report of each. */
    async run(_passed: Array<string>, options: ImportInterviewOptions): Promise<void> {
        await this.interviews.import({
            directory: options.dir,
            ref: options.ref,
            only: options.only,
            overlay: options.overlay,
        })
    }
}
