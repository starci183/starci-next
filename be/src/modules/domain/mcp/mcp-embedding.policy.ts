import { createHash } from "node:crypto"

/** The width every stored vector has: the model's 4096 dimensions cut to the first 1024 (Matryoshka) and normalised. */
export const EMBEDDING_DIMENSIONS = 1024

/** The most lines one chunk of text or code holds, and how many the next chunk repeats. */
const CHUNK_LINES = 40
const CHUNK_OVERLAP = 8
/** The most characters one chunk sends to the embedder. */
const CHUNK_CHARS = 2400

/** One piece of the corpus: where it is and what it says. */
export interface Chunk {
    /** The path of a repository file, or `section/<n>` of a lesson. */
    readonly path: string
    /** The 1-based first line of the chunk. */
    readonly line: number
    /** The text. */
    readonly text: string
}

/**
 * The first `EMBEDDING_DIMENSIONS` values of a model vector, scaled to unit length (MRL truncation, then L2 normalisation), so
 * the dot product of two vectors is their cosine. Null when the vector is too short or is all zeros.
 */
export const truncatedUnitVectorOf = (vector: ReadonlyArray<number>): Array<number> | null => {
    if (vector.length < EMBEDDING_DIMENSIONS) return null
    const head = vector.slice(0, EMBEDDING_DIMENSIONS)
    const norm = Math.sqrt(head.reduce((sum, value) => sum + value * value, 0))
    if (!Number.isFinite(norm) || norm === 0) return null
    return head.map((value) => value / norm)
}

/** The dot product of two unit vectors of the same width, which is their cosine similarity. */
export const cosineOf = (a: ReadonlyArray<number>, b: ReadonlyArray<number>): number => {
    let sum = 0
    for (let index = 0; index < a.length; index += 1) sum += (a[index] ?? 0) * (b[index] ?? 0)
    return sum
}

/** Cuts a text into overlapping line windows of bounded size; a blank chunk is dropped. */
export const chunksOf = (path: string, text: string): Array<Chunk> => {
    const lines = text.split(/\r?\n/u)
    const chunks: Array<Chunk> = []
    for (let start = 0; start < lines.length; start += CHUNK_LINES - CHUNK_OVERLAP) {
        const body = lines
            .slice(start, start + CHUNK_LINES)
            .join("\n")
            .slice(0, CHUNK_CHARS)
        if (body.trim().length > 0) chunks.push({ path, line: start + 1, text: body })
        if (start + CHUNK_LINES >= lines.length) break
    }
    return chunks
}

/** A stable key of a corpus: the same ordered paths and texts always name the same key. */
export const corpusKeyOf = (parts: ReadonlyArray<string>): string =>
    createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 32)

/**
 * The content hash of a chunk: the model identity and the exact text. The same text under the same model always has the same
 * hash, so a chunk already embedded is never embedded twice, and a changed text or a changed model is a new hash.
 */
export const chunkHashOf = (model: string, text: string): string =>
    createHash("sha256").update(model).update("\u0000").update(text).digest("hex")
