import { createInterface } from "node:readline"
import type { Readable, Writable } from "node:stream"
import { Injectable } from "@nestjs/common"
import { serveStore, type StoreAdapter } from "@starci/seed"
import { InjectDatabaseStore } from "./seed.decorators"

@Injectable()
/**
 * The seed door of the database store: serves the store over the line protocol `starci/data-entries@1` (PROJECT-STACKS-14), the
 * command the bring-up loader runs to write a pinned standard into the app. One answer per line on the output, entry lines on the
 * input, the exit code the protocol returns.
 */
export class SeedDoorService {
    constructor(@InjectDatabaseStore() private readonly store: StoreAdapter) {}

    /** Serves one verb (`describe`, `export`, `import`, `identity`) and answers the exit code. */
    serve(args: ReadonlyArray<string>, input: Readable, output: Writable): Promise<number> {
        return serveStore(this.store, {
            args,
            lines: createInterface({ input, crlfDelay: Infinity }),
            write: (line) => {
                output.write(`${line}\n`)
            },
        })
    }
}
