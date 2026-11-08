import type { ProjectLocale } from "@modules/domain/project"

/** What points a concept of a project at code and at the endpoint the probes aim at takes. */
export interface SetProjectConceptRequest {
    /** The projectId. */
    readonly projectId: string
    /** The conceptId. */
    readonly conceptId: string
    /** The location. */
    readonly location: string | null
    /** The endpoint. */
    readonly endpoint: string | null
    /** The sampleBody. */
    readonly sampleBody: string | null
    /** The locale. */
    readonly locale: ProjectLocale
}
