/**
 * The course capability of Essentials v2.
 *
 * One lesson is one lab with happy and unhappy cases the learner makes green on their own machine. `CourseLabSeedSet` holds the
 * `essentials-labs` set of the seed standard (lab@2 records, immutable versions by content hash) and `CourseSeedSet` its `essentials-courses`
 * set (course records, the same versioning); `CourseCatalogService` lists the courses and their lessons for any signed-in learner; `CourseLabService` projects a
 * record for the web with the hint texts of the opened levels only; `CourseCaseService` answers which cases are open, opens hints in
 * order and stores the runs, hints and resets a learner's machine uploads; `CourseRungService` hands a paired device one ladder rung of
 * the learner file at a time (the diff once the case is recorded green, the reset at any time, recorded). It never reads or sends a
 * grader file.
 */
export { CourseCaseService } from "./course-case.service"
export { CourseCatalogService } from "./course-catalog.service"
export { CourseLabService } from "./course-lab.service"
export { CourseLabSeedSet } from "./course-lab-seed.set"
export { CourseSeedSet } from "./course-seed.set"
export { CourseRungService } from "./course-rung.service"
export { COURSE_RUNG_KIND_PREFIX, type CourseRungFile } from "./course-rung.policy"
export { COURSE_ERROR_KINDS, CourseError, CourseErrorCode } from "./errors/course.error"
export { COURSE_MESSAGES } from "./messages/course.messages"
export { courseEntities } from "./persistence/entities"
export { CourseModule } from "./course.module"
export type {
    CourseCaseKind,
    CourseCasesView,
    CourseCaseSpecView,
    CourseCaseStateView,
    CourseCaseStatus,
    CourseChaosView,
    CourseDepView,
    CourseFailure,
    CourseHintOpened,
    CourseHintView,
    CourseInvariantView,
    CourseLastRunView,
    CourseLessonView,
    CourseLocale,
    CourseRunStatus,
    CourseServiceView,
    CourseText,
    CourseUploadReceipt,
} from "./course-lab.contracts"
export { COURSE_HINT_LEVELS, COURSE_LOCALES } from "./course-lab.contracts"
export type {
    CourseBilingual,
    CourseCatalogDetailView,
    CourseCatalogEntryView,
    CourseCatalogLessonView,
    CourseSystemEdgeView,
    CourseSystemNodeView,
} from "./course-catalog.contracts"
