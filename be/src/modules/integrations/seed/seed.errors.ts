/** A refusal of one entry by a set: the code travels to the loader, never the value. */
export class SeedRefusal extends Error {
    /** @param code The upper-snake code of the refusal (`LESSON_RECORD_INVALID`). */
    constructor(readonly code: string) {
        super(code)
        this.name = "SeedRefusal"
    }
}
