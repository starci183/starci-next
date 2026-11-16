import type { ProjectLocale } from "@modules/domain/project"

/** What previews the CV line of a concept or a milestone of a project takes. */
export interface GetProjectCvPreviewRequest {
    /** The projectId. */
    readonly projectId: string
    /** The conceptId, or null when a milestone is named. */
    readonly conceptId: string | null
    /** The milestoneId, or null when a concept is named. */
    readonly milestoneId: string | null
    /** The locale. */
    readonly locale: ProjectLocale
}
