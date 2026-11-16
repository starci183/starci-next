import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { HarnessRawFile } from "./harness.contracts"

/**
 * The port that reads the `raw/harness` tree of a content checkout. An object, not a bare function, so a unit spec doubles it with
 * `mock<HarnessSourceReader>()`.
 */
export interface HarnessSourceReader {
    /** Every text file below `<directory>/raw/harness`, as `raw/harness/...` posix paths with their text, sorted by path. */
    read(directory: string): Promise<ReadonlyArray<HarnessRawFile>>
    /** Whether `<directory>/raw/harness` exists. */
    exists(directory: string): Promise<boolean>
}

/** Token of the port that reads the raw harness tree. */
export const HARNESS_SOURCE: unique symbol = Symbol("domain.harness.source")

/** Injects the port that reads the raw harness tree. Parameter type: HarnessSourceReader. */
export const InjectHarnessSource = (): TypedParameterDecorator<HarnessSourceReader> =>
    injector<HarnessSourceReader>(HARNESS_SOURCE)
