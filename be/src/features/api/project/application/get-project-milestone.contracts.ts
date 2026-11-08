import type { ProjectLocale } from "@modules/domain/project"

/** What reads the concept checklist of one milestone of a project; a milestone past the free ones needs premium takes. */
export interface GetProjectMilestoneRequest {
    /** The projectId. */
    readonly projectId: string
    /** The milestoneId. */
    readonly milestoneId: string
    /** The locale. */
    readonly locale: ProjectLocale
}
