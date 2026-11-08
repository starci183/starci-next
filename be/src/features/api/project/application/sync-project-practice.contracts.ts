import type { ProjectLocale } from "@modules/domain/project"

/** What pulls the results the learner machine reported over the relay (practice) into a project takes. */
export interface SyncProjectPracticeRequest {
    /** The projectId. */
    readonly projectId: string
    /** The locale. */
    readonly locale: ProjectLocale
}
