import type { ProjectLocale } from "@modules/domain/project"

/** What lists the projects of the signed-in learner, each with its progress takes. */
export interface ListProjectsRequest {
    /** The locale. */
    readonly locale: ProjectLocale
}
