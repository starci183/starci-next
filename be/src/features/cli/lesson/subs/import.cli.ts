import { CommandRunner, Option, SubCommand } from "nest-commander"
import { LessonImportService } from "@modules/domain/lesson"

/** The options of `cli lessons import`. */
export interface ImportLessonsOptions {
    /** The directory that holds the concept folders. */
    readonly dir: string
    /** The label of the source ref, used as the version of every lesson imported. */
    readonly ref: string
    /** The concept folders to import, separated by commas; empty for every folder. */
    readonly only: string
}

@SubCommand({
    name: "import",
    description: "Import concept folders as immutable lesson versions and print their counts, versions and hashes",
})
/**
 * `cli lessons import --dir <path> --ref <label> [--only <folders>]`: delegates to the lesson import, which validates the whole
 * folder first, leaves an identical version alone, refuses other bytes under a stored version and logs one report line per
 * folder (never an answer).
 */
export class ImportLessonsCli extends CommandRunner {
    constructor(private readonly lessons: LessonImportService) {
        super()
    }

    /** `--dir <path>`: the directory that holds the concept folders. */
    @Option({ flags: "--dir <path>", description: "The directory that holds the concept folders", required: true })
    parseDir(value: string): string {
        return value
    }

    /** `--ref <label>`: the source ref (a git sha), the version of every lesson imported. */
    @Option({ flags: "--ref <label>", description: "The source ref, used as the version", required: true })
    parseRef(value: string): string {
        return value
    }

    /** `--only <folders>`: a comma-separated list of concept folders. */
    @Option({
        flags: "--only <folders>",
        description: "Comma-separated concept folders to import (default: every folder)",
        defaultValue: "",
    })
    parseOnly(value: string): string {
        return value
    }

    /** Imports the folders and logs the report of each. */
    async run(_passed: Array<string>, options: ImportLessonsOptions): Promise<void> {
        await this.lessons.import({ directory: options.dir, ref: options.ref, only: options.only })
    }
}
