import type { ProjectLocale } from "@modules/domain/project"

/** What changes a project of the signed-in learner takes. */
export interface UpdateProjectRequest {
    /** The projectId. */
    readonly projectId: string
    /** The name. */
    readonly name: string | null
    /** The topic. */
    readonly topic: string | null
    /** The language. */
    readonly language: string | null
    /** The stack. */
    readonly stack: string | null
    /** The repoUrl. */
    readonly repoUrl: string | null
    /** The deployedUrl. */
    readonly deployedUrl: string | null
    /** The locale. */
    readonly locale: ProjectLocale
}
