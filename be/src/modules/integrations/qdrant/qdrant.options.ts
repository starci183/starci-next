import type { Secret } from "@modules/platform/config"

/** How the app reaches its Qdrant service, as the environment says it. */
export interface QdrantConfig {
    /** The base address of the service, without a trailing slash. */
    readonly url: string
    /** The API key of the service, sealed; null for a service that asks for none (a private network). */
    readonly apiKey: Secret | null
    /** How long one call may take, milliseconds. */
    readonly timeoutMs: number
    /** The one collection of the app vectors. */
    readonly collection: string
    /** The size of every vector: the dimensions of the embeddings the app stores. */
    readonly dimensions: number
}

/** What the module is registered with: the service and the payload fields the filters read (each is indexed). */
export interface QdrantOptions extends QdrantConfig {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The payload fields the filters read; each gets a keyword index so a filtered search stays fast. */
    readonly payloadIndexes: ReadonlyArray<string>
}
