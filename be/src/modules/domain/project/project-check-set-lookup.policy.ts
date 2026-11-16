import type { ConceptDefinition, MilestoneDefinition, ProjectKind } from "./project.contracts"

/**
 * The part of the check set the proof model reads: the concepts, the milestones and the milestone ids each kind of project lists. The
 * check set read from content satisfies it as it is, so the standing of a project never depends on a catalog written in code.
 */
export interface ProjectCatalog {
    /** The concepts in catalog order. */
    readonly concepts: ReadonlyArray<ConceptDefinition>
    /** The milestones in catalog order. */
    readonly milestones: ReadonlyArray<MilestoneDefinition>
    /** The milestone ids each project kind lists. */
    readonly kinds: Readonly<Record<ProjectKind, ReadonlyArray<string>>>
}

/** The milestones a project of this kind lists, in catalog order. */
export const milestonesOfKind = (catalog: ProjectCatalog, kind: ProjectKind): ReadonlyArray<MilestoneDefinition> =>
    catalog.milestones.filter((milestone) => catalog.kinds[kind].includes(milestone.id))

/** The ids of the concepts the milestones of a kind list, each once, in catalog order. */
export const conceptIdsOfKind = (catalog: ProjectCatalog, kind: ProjectKind): ReadonlyArray<string> => [
    ...new Set(milestonesOfKind(catalog, kind).flatMap((milestone) => milestone.concepts)),
]

/** The concept of the catalog, or null when the id is not one. */
export const conceptIn = (catalog: Pick<ProjectCatalog, "concepts">, id: string): ConceptDefinition | null =>
    catalog.concepts.find((concept) => concept.id === id) ?? null

/** The milestone of the catalog, or null when the id is not one. */
export const milestoneIn = (catalog: Pick<ProjectCatalog, "milestones">, id: string): MilestoneDefinition | null =>
    catalog.milestones.find((milestone) => milestone.id === id) ?? null

/** Whether a project of this kind lists the concept in one of its milestones. */
export const isListed = (catalog: ProjectCatalog, kind: ProjectKind, conceptId: string): boolean =>
    milestonesOfKind(catalog, kind).some((milestone) => milestone.concepts.includes(conceptId))

/**
 * The lesson that teaches a concept now: the first of its learn links whose lesson is live. A concept links no lesson, or only lessons
 * that are not written yet, falls back to the lesson that carries its own id, else has none; the AI read needs one for its rubric,
 * and a CV line needs one to cite.
 */
export const learnLessonOf = (concept: ConceptDefinition, liveLessons: ReadonlySet<string>): string | null =>
    concept.learn.find((link) => liveLessons.has(link.lesson))?.lesson ??
    (liveLessons.has(concept.id) ? concept.id : null)

/** Whether a concept cannot be proved yet: it needs the AI read and no lesson with a rubric teaches it. */
export const isComingSoon = (concept: ConceptDefinition, liveLessons: ReadonlySet<string>): boolean =>
    concept.requires.some((group) => group.includes("code-read")) && learnLessonOf(concept, liveLessons) === null
