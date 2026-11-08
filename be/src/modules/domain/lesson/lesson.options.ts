import type { LessonTopicCatalog } from "./lesson-topic.contracts"

/** Options of the lesson capability. */
export interface LessonOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The topic catalog the import places lessons with; the teacher's catalog when absent. */
    readonly topics?: LessonTopicCatalog
}
