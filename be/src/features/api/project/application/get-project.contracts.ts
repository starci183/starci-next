import type { ProjectLocale } from "@modules/domain/project"

/** What reads one project of the signed-in learner with its milestones, practice and proof takes. */
export interface GetProjectRequest {
    /** The projectId. */
    readonly projectId: string
    /** The locale. */
    readonly locale: ProjectLocale
}
