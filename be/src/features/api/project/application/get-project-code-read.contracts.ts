import type { ProjectLocale } from "@modules/domain/project"

/** What reads the newest AI code read of a concept of a project takes. */
export interface GetProjectCodeReadRequest {
    /** The projectId. */
    readonly projectId: string
    /** The conceptId. */
    readonly conceptId: string
    /** The locale. */
    readonly locale: ProjectLocale
}
