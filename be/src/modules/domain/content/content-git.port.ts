import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { ContentSnapshot, ContentSourceConfig, ContentSourceId } from "./content.contracts"

/** What a pull asks for. */
export interface MaterializeParams {
    /** The repository being pulled. */
    readonly source: ContentSourceId
    /** Its URL, ref and token. */
    readonly config: ContentSourceConfig
    /** The directory that holds the versioned snapshots. */
    readonly datasourcesDir: string
    /** The instant written into the manifest of a new snapshot. */
    readonly now: string
}

/** A pulled snapshot and whether this pull wrote it. */
export interface MaterializedSnapshot {
    /** The snapshot. */
    readonly snapshot: ContentSnapshot
    /** False when the commit was already stored and nothing was written. */
    readonly created: boolean
}

/**
 * The port that turns a git repository into a versioned snapshot on disk, and names a local checkout. An object, not a bare
 * function, so a unit spec doubles it with `mock<ContentGitReader>()`.
 */
export interface ContentGitReader {
    /**
     * Clones or fetches the repository into a mirror below the datasources directory, resolves the ref to a commit and writes
     * `<datasourcesDir>/<sha>/` with its `manifest.json`. A commit already stored is returned as it is.
     */
    materialize(params: MaterializeParams): Promise<MaterializedSnapshot>
    /**
     * A version label for a local checkout: the short commit sha when the tree is clean, that sha with a hash of the files when it
     * is not, and `local` for a directory that is not a git checkout.
     */
    fingerprint(directory: string): Promise<string>
}

/** Token of the port that pulls git repositories. */
export const CONTENT_GIT: unique symbol = Symbol("domain.content.git")

/** Injects the port that pulls git repositories. Parameter type: ContentGitReader. */
export const InjectContentGit = (): TypedParameterDecorator<ContentGitReader> => injector<ContentGitReader>(CONTENT_GIT)
