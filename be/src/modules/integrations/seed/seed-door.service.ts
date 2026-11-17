import { writeSync } from "node:fs"
import { createInterface } from "node:readline"
import type { Readable, Writable } from "node:stream"
import { Injectable } from "@nestjs/common"
import { serveStore, type StoreAdapter } from "@starci/seed"
import { InjectDatabaseStore } from "./seed.decorators"

/** The file descriptor of the standard output. */
const STDOUT_FD = 1

const NEWLINE = "\n"

@Injectable()
/**
 * The seed door of the database store: serves the store over the line protocol `starci/data-entries@1` (PROJECT-STACKS-14), the
 * command the bring-up loader runs to write a pinned standard into the app. One answer per line on the output, entry lines on the
 * input, the exit code the protocol returns.
 */
export class SeedDoorService {
    constructor(@InjectDatabaseStore() private readonly store: StoreAdapter) {}

    /** Serves one verb (`describe`, `export`, `import`, `identity`) and answers the exit code. */
    async serve(args: ReadonlyArray<string>, input: Readable, output: Writable): Promise<number> {
        const answers: Array<string> = []
        const code = await serveStore(this.store, {
            args,
            lines: createInterface({ input, crlfDelay: Infinity }),
            write: (line) => {
                answers.push(line)
            },
        })
        // The loader reads the last line of stdout as the answer, and the process logs while it shuts down: the answer is written on exit, after them.
        process.once("exit", () => {
            const text = answers.map((line) => line + NEWLINE).join("")
            if (output === process.stdout) writeSync(STDOUT_FD, text)
            else output.write(text)
        })
        return code
    }
}
