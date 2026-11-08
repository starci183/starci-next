import { CommandRunner, Option, SubCommand } from "nest-commander"
import { PracticeImportService } from "@modules/domain/practice"

/** The options of `cli practice import`. */
export interface ImportPracticeOptions {
    /** The directory that holds the `sets` folder of the coding problems. */
    readonly dir: string
    /** The label of the source ref, used as the version of every problem imported. */
    readonly ref: string
    /** The pattern folders to import, separated by commas; empty for every pattern. */
    readonly only: string
}

@SubCommand({
    name: "import",
    description: "Import the coding problems as immutable versions and print their counts and statuses",
})
/**
 * `cli practice import --dir <path> --ref <label> [--only <patterns>]`: delegates to the practice import, which validates each
 * problem folder first, leaves an identical version alone, refuses other bytes under a stored version and logs one report
 * line per problem (never a test or a solution).
 */
export class ImportPracticeCli extends CommandRunner {
    constructor(private readonly practice: PracticeImportService) {
        super()
    }

    /** `--dir <path>`: the directory that holds the `sets` folder. */
    @Option({ flags: "--dir <path>", description: "The directory that holds the sets folder", required: true })
    parseDir(value: string): string {
        return value
    }

    /** `--ref <label>`: the source ref (a git sha), the version of every problem imported. */
    @Option({ flags: "--ref <label>", description: "The source ref, used as the version", required: true })
    parseRef(value: string): string {
        return value
    }

    /** `--only <patterns>`: a comma-separated list of pattern folders. */
    @Option({
        flags: "--only <patterns>",
        description: "Comma-separated pattern folders to import (default: every pattern)",
        defaultValue: "",
    })
    parseOnly(value: string): string {
        return value
    }

    /** Imports the problems and logs the report of each. */
    async run(_passed: Array<string>, options: ImportPracticeOptions): Promise<void> {
        await this.practice.import({ directory: options.dir, ref: options.ref, only: options.only })
    }
}
