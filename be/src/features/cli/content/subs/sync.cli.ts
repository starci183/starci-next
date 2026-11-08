import { CommandRunner, Option, SubCommand } from "nest-commander"
import { ContentSyncService } from "@modules/domain/content"

/** The options of `cli content sync`. */
export interface SyncContentOptions {
    /** A local checkout of the content repository; absent, the git mount of the environment is pulled. */
    readonly dir?: string
    /** A local checkout of the teacher's data repository; absent, the git mount of the environment is pulled, if it has one. */
    readonly dataDir?: string
    /** The kinds to run, separated by commas; empty runs them all. */
    readonly only: string
}

@SubCommand({
    name: "sync",
    description: "Pull the content repositories (git, or local directories) and import each kind at the pulled version",
})
/**
 * `cli content sync [--dir <content>] [--data-dir <data>] [--only <kinds>]`: delegates to the content sync, which pulls the
 * repositories into versioned snapshots (or takes the local directories without any git credential), runs each importer at that
 * version and logs one line per kind. A kind that fails leaves its live version as it was and fails the command at the end.
 */
export class SyncContentCli extends CommandRunner {
    constructor(private readonly content: ContentSyncService) {
        super()
    }

    /** `--dir <path>`: a local checkout of the content repository (development). */
    @Option({ flags: "--dir <path>", description: "A local checkout of the content repository (no git, no token)" })
    parseDir(value: string): string {
        return value
    }

    /** `--data-dir <path>`: a local checkout of the data repository (development). */
    @Option({ flags: "--data-dir <path>", description: "A local checkout of the data repository (no git, no token)" })
    parseDataDir(value: string): string {
        return value
    }

    /** `--only <kinds>`: a comma-separated list of kinds. */
    @Option({
        flags: "--only <kinds>",
        description: "Comma-separated kinds to run: lessons, interview, review, practice, catalogs (default: all)",
        defaultValue: "",
    })
    parseOnly(value: string): string {
        return value
    }

    /** Runs the sync and logs the report of each kind. */
    async run(_passed: Array<string>, options: SyncContentOptions): Promise<void> {
        await this.content.sync({ contentDir: options.dir, dataDir: options.dataDir, only: options.only })
    }
}
