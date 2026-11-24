/**
 * The course capability of Essentials v2.
 *
 * One lesson is one lab with happy and unhappy cases the learner makes green on their own machine. `CourseLabSeedSet` holds the
 * `essentials-labs` set of the seed standard (lab@2 records, immutable versions by content hash); `CourseLabService` projects a
 * record for the web with the hint texts of the opened levels only; `CourseCaseService` answers which cases are open, opens hints in
 * order and stores the runs, hints and resets a learner's machine uploads. It never reads or sends a grader file.
 */
export { CourseCaseService } from "./course-case.service"
export { CourseLabService } from "./course-lab.service"
export { CourseLabSeedSet } from "./course-lab-seed.set"
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
