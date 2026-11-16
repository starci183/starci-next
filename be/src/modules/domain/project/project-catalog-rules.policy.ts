import type { ConceptDefinition, EvidenceSlot } from "./project.contracts"

/** One concept whose evidence requirement breaks the proof model, with why. */
export interface CatalogIssue {
    /** The concept id. */
    readonly concept: string
    /** What is wrong. */
    readonly message: string
}

const groupOf = (...slots: ReadonlyArray<EvidenceSlot>): string => slots.join("|")

/** The requirement of a concept as `a|b + c`, so a rule compares one string. */
const shapeOf = (definition: ConceptDefinition): string =>
    definition.requires.map((group) => groupOf(...[...group].sort((a, b) => a.localeCompare(b)))).join(" + ")

/**
 * The requirement the proof model gives a concept, from its kind and surface. A behaviour concept with an HTTP surface needs a test or
 * an e2e flow and a server probe; a behaviour concept with no HTTP surface needs an e2e flow and the AI code read; a structure concept
 * needs a test and the AI code read. A concept may add more groups (a tool concept asks for the code read too) but never drops one.
 */
export const requiredGroupsOf = (definition: ConceptDefinition): ReadonlyArray<string> => {
    if (definition.kind === "structure") return ["test", "code-read"]
    return definition.http ? ["e2e|test", "probe"] : ["e2e", "code-read"]
}

/**
 * The problems of a catalog against the proof model. The state machine reads only `requires`, so this is where a catalog entry that
 * would be too easy to prove (a behaviour concept proved by tests alone, a no-HTTP concept waiting on a probe that can never run) is
 * caught, before any learner meets it.
 */
export const catalogIssuesOf = (definitions: ReadonlyArray<ConceptDefinition>): ReadonlyArray<CatalogIssue> =>
    definitions.flatMap((definition) => {
        const issues: Array<CatalogIssue> = []
        const have = shapeOf(definition).split(" + ")
        const missing = requiredGroupsOf(definition).filter((group) => !have.includes(group))
        if (missing.length > 0)
            issues.push({ concept: definition.id, message: `requires lacks the group ${missing.join(", ")}` })
        if (!definition.http && definition.requires.some((group) => group.includes("probe")))
            issues.push({ concept: definition.id, message: "has no HTTP surface but requires a probe" })
        if (definition.http && definition.kind === "behaviour" && definition.probes.length === 0)
            issues.push({ concept: definition.id, message: "has an HTTP surface but names no probe" })
        return issues
    })
