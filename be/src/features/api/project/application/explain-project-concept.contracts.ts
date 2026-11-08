import type { ProjectLocale } from "@modules/domain/project"

/** What has the ai teacher read the code a concept points to and the learner's explanation; it needs premium takes. */
export interface ExplainProjectConceptRequest {
    /** The projectId. */
    readonly projectId: string
    /** The conceptId. */
    readonly conceptId: string
    /** The location. */
    readonly location: string
    /** The excerpt. */
    readonly excerpt: string
    /** The explanation. */
    readonly explanation: string
    /** The locale. */
    readonly locale: ProjectLocale
}
