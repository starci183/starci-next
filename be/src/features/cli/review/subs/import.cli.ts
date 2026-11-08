import { CommandRunner, Option, SubCommand } from "nest-commander"
import { ReviewImportService } from "@modules/domain/review"

/** The options of `cli review import`. */
export interface ImportReviewDecksOptions {
    /** The checkout of starci-lab/data that holds courses/<course>/flashcard-decks. */
    readonly dir: string
    /** The label of the source ref, used as the version of every deck imported. */
    readonly ref: string
    /** The deck ids to import, separated by commas; empty for every deck. */
    readonly only: string
}

@SubCommand({
    name: "import",
    description: "Import flashcard decks as immutable deck versions and print their counts, versions and hashes",
})
/**
 * `cli review import --dir <path> --ref <label> [--only <deckIds>]`: delegates to the deck import, which validates the whole
 * folder first, leaves an identical version alone, refuses other bytes under a stored version and logs one report line per deck
 * (never a card text).
 */
export class ImportReviewDecksCli extends CommandRunner {
    constructor(private readonly decks: ReviewImportService) {
        super()
    }

    /** `--dir <path>`: the checkout of starci-lab/data. */
    @Option({ flags: "--dir <path>", description: "The checkout of starci-lab/data", required: true })
    parseDir(value: string): string {
        return value
    }

    /** `--ref <label>`: the source ref (a git sha), the version of every deck imported. */
    @Option({ flags: "--ref <label>", description: "The source ref, used as the version", required: true })
    parseRef(value: string): string {
        return value
    }

    /** `--only <deckIds>`: a comma-separated list of deck ids (`<course>/<deck folder>`). */
    @Option({
        flags: "--only <deckIds>",
        description: "Comma-separated deck ids to import (default: every deck)",
        defaultValue: "",
    })
    parseOnly(value: string): string {
        return value
    }

    /** Imports the decks and logs the report of each. */
    async run(_passed: Array<string>, options: ImportReviewDecksOptions): Promise<void> {
        await this.decks.import({ directory: options.dir, ref: options.ref, only: options.only })
    }
}
