import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/**
 * The port that looks at a content checkout on disk. An object, not a bare function, so a unit spec doubles it with
 * `mock<ContentDiskReader>()`.
 */
export interface ContentDiskReader {
    /** Whether the path exists. */
    exists(path: string): Promise<boolean>
    /** The names of the sub-folders of a directory, sorted; empty when it does not exist. */
    folders(path: string): Promise<ReadonlyArray<string>>
    /** Every file below the root as a posix path relative to it, sorted; empty when the root does not exist. */
    files(root: string): Promise<ReadonlyArray<string>>
    /** The text of a file. */
    text(path: string): Promise<string>
    /** Writes a JSON document, creating the directory. */
    writeJson(path: string, value: unknown): Promise<void>
}

/** Token of the port that looks at a content checkout. */
export const CONTENT_DISK: unique symbol = Symbol("domain.content.disk")

/** Injects the port that looks at a content checkout. Parameter type: ContentDiskReader. */
export const InjectContentDisk = (): TypedParameterDecorator<ContentDiskReader> =>
    injector<ContentDiskReader>(CONTENT_DISK)
