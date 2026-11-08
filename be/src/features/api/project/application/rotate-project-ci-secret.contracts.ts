import type { ProjectLocale } from "@modules/domain/project"

/** What replaces the ci secret of a project and answers the new one, shown this once takes. */
export interface RotateProjectCiSecretRequest {
    /** The projectId. */
    readonly projectId: string
    /** The locale. */
    readonly locale: ProjectLocale
}
