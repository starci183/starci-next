import type { ProjectLocale, ProjectKind } from "@modules/domain/project"

/** What creates a project for the signed-in learner and answers it with its ci secret, shown this once takes. */
export interface CreateProjectRequest {
    /** The name. */
    readonly name: string
    /** The kind. */
    readonly kind: ProjectKind
    /** The topic. */
    readonly topic: string
    /** The language. */
    readonly language: string
    /** The stack. */
    readonly stack: string
    /** The track. */
    readonly track: string | null
    /** The repoUrl. */
    readonly repoUrl: string | null
    /** The locale. */
    readonly locale: ProjectLocale
}
