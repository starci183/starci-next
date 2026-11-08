import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

/** An empty directory for concept folders, new for every case. */
export interface ConceptsDirectory {
    /** The path of the directory of the running case. */
    path(): string
}

/** Registers the hooks that give every case its own empty directory for concept folders and remove it after the case. */
export const useConceptsDirectory = (): ConceptsDirectory => {
    let directory = ""
    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), "starci-concepts-"))
    })
    afterEach(async () => {
        await rm(directory, { recursive: true, force: true })
    })
    return { path: () => directory }
}
