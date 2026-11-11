/**
 * The Lessons content capability.
 *
 * Features read through `LessonReadService` (the catalog and the public projection) and the cli runs `LessonImportService`.
 * The server-side port for attempts and grading is `LessonContentService`, injected by class:
 * `activity({ lessonId, version, activityId, locale })` answers the whole stored activity (rubric, answers, option
 * correctness) of the version a learner studies, with the phase of its section, and
 * `requireAccess({ learnerId, phase, isPremium })` throws `LESSON_PREMIUM_REQUIRED` for Premium content: content the teacher marked
 * `isPremium: true`, or, when the content carries no mark (the `isPremium` the activity answers), any phase but the free one. The
 * teacher marks a section or a whole lesson with `isPremium: false|true` in its front matter. Nothing it returns may leave the
 * server before a submit.
 */
export { LessonContentService } from "./lesson-content.service"
export { LESSON_ERROR_KINDS, LessonError, LessonErrorCode } from "./errors/lesson.error"
export { LESSON_MESSAGES } from "./messages/lesson.messages"
export { lessonEntities, lessonMigrations } from "./persistence/connection"
export { LessonImportService } from "./lesson-import.service"
export { LessonLinkService } from "./lesson-link.service"
export { LessonModule } from "./lesson.module"
export { LessonReadService } from "./lesson-read.service"
export { LESSON_WORKSPACE_LANGUAGES } from "./lesson.contracts"
export type {
    LessonActivity,
    LessonContent,
    LessonDifficulty,
    LessonLocale,
    LessonLocaleDocument,
    LessonPhase,
    LessonRootFile,
    LessonSection,
    LessonSimulation,
    LessonWorkspaceFile,
} from "./lesson.contracts"
export type { LessonSourceFile } from "./lesson-import.contracts"
export type { LessonTopicCatalog, LessonTopicStep } from "./lesson-topic.contracts"
export type { LessonTopicView } from "./lesson-topic-view.contracts"
export type {
    LessonActivityParams,
    LessonArchiveView,
    LessonCatalogItemView,
    LessonOutline,
    LessonOutlineActivity,
    LessonPlan,
    LessonView,
} from "./lesson-read.contracts"
