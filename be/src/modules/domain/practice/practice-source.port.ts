import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { PracticeSourceEntry, PracticeSourceFile } from "./practice.contracts"

/**
 * The port that reads the teacher's problem folders from a directory. An object, not a bare function, so a unit spec doubles it
 * with `mock<PracticeSourceReader>()`.
 */
export interface PracticeSourceReader {
    /** Lists every problem folder below `<directory>/sets/<pattern>/problems/<slug>`, sorted by pattern and slug. */
    entries(directory: string): Promise<ReadonlyArray<PracticeSourceEntry>>
    /** Reads the `en.md` and `vi.md` of one problem folder with the hash of their raw bytes, sorted by path. */
    read(directory: string, entry: PracticeSourceEntry): Promise<ReadonlyArray<PracticeSourceFile>>
}

/** Token of the port that reads problem folders. */
export const PRACTICE_SOURCE: unique symbol = Symbol("domain.practice.source")

/** Injects the port that reads problem folders. Parameter type: PracticeSourceReader. */
export const InjectPracticeSource = (): TypedParameterDecorator<PracticeSourceReader> =>
    injector<PracticeSourceReader>(PRACTICE_SOURCE)
