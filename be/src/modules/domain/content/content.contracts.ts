/** The repositories the content pull knows: the content repository and the teacher's data repository. */
export type ContentSourceId = "content" | "data"

/** One repository to pull: where it is, which ref to take and the token that opens it. */
export interface ContentSourceConfig {
    /** The git URL of the repository. */
    readonly url: string
    /** A branch, tag or pinned sha; absent takes the default branch. */
    readonly ref: string | null
    /** The token that opens a private repository, or null for a public one. Never logged and never written to disk. */
    readonly token: { reveal(): string } | null
}

/** The git mount of an environment: where versioned snapshots live and which repositories fill them. */
export interface ContentGitConfig {
    /** The directory that holds the versioned snapshots `<sha>/` and `active.json`; it survives redeploys. */
    readonly datasourcesDir: string
    /** The content repository. */
    readonly content: ContentSourceConfig
    /** The teacher's data repository, or null when the environment pulls the content repository alone. */
    readonly data: ContentSourceConfig | null
}

/** A repository materialised on disk at one commit. */
export interface ContentSnapshot {
    /** The repository. */
    readonly source: ContentSourceId
    /** The full commit sha. */
    readonly sha: string
    /** The directory that holds the files of that commit. */
    readonly directory: string
}

/** The `manifest.json` written beside the files of a snapshot. */
export interface SnapshotManifest {
    /** The format of this file. */
    readonly schema: "starci-next/datasource-snapshot@1"
    /** The repository the snapshot came from. */
    readonly source: ContentSourceId
    /** The repository URL without any credential. */
    readonly url: string
    /** The ref that was asked for, or `HEAD` for the default branch. */
    readonly ref: string
    /** The full commit sha. */
    readonly sha: string
    /** When the snapshot was written, as an ISO instant. */
    readonly fetchedAt: string
}

/** The kinds of content the sync imports or records, in the order it runs them. */
export type ContentKind = "lessons" | "interview" | "review" | "practice" | "catalogs"

/** How one kind went. */
export type ContentKindStatus = "imported" | "skipped" | "failed"

/** The one line the sync keeps per kind. */
export interface ContentKindReport {
    /** The kind. */
    readonly kind: ContentKind
    /** What happened. */
    readonly status: ContentKindStatus
    /** The version label the importer stored (the ref), or an empty text when nothing ran. */
    readonly version: string
    /** A short fact for the log: a count, the reason it was skipped or the code that failed it. Never content. */
    readonly detail: string
}

/** The environment variables the git processes of a pull start from. */
export type InheritedVariables = Readonly<Record<string, string>>

/**
 * Carries the variables the git processes start from. A holder with a reader, not the plain record, so the options never
 * serialize a token that sits among the variables.
 */
export interface ContentEnvironment {
    /** The variables, as the environment declared them. */
    readonly read: () => InheritedVariables
}

/** What a sync asks for. */
export interface SyncContentParams {
    /** A local checkout of the content repository; with `dataDir` it replaces the git pull of that repository. */
    readonly contentDir?: string | undefined
    /** A local checkout of the data repository. */
    readonly dataDir?: string | undefined
    /** The kinds to run, separated by commas; an empty text runs them all. */
    readonly only: string
}

/** One snapshot the pointer names. */
export interface ActiveSnapshot {
    /** The commit the snapshot holds. */
    readonly sha: string
    /** Where it lies on disk. */
    readonly directory: string
}

/** The pointer to the snapshots in use, written after a successful pull. */
export interface ActiveSnapshots {
    /** The format of this file. */
    readonly schema: "starci-next/datasource-active@1"
    /** The sha and directory of the content snapshot. */
    readonly content: ActiveSnapshot
    /** The sha and directory of the data snapshot, or null. */
    readonly data: ActiveSnapshot | null
    /** When the pull finished, as an ISO instant. */
    readonly syncedAt: string
}
