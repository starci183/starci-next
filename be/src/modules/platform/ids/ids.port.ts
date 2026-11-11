/** The ids port: business code asks it for a fresh identifier instead of minting one from the ambient random source, so a spec can say every id. */
export interface Ids {
    /** A fresh identifier (a UUID). */
    next(): string
}
