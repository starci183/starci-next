import type { ProjectLocale } from "@modules/domain/project"

/** What reads the milestones and concepts a project can pursue takes. */
export interface GetProjectCatalogRequest {
    /** The locale. */
    readonly locale: ProjectLocale
}
