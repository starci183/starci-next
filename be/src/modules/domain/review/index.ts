/**
 * The review capability (spaced repetition).
 *
 * - `ReviewQueueService.summary(learnerId, locale)` answers `{ date, due, overdue, newAvailable, goalDaily, doneToday }` for the
 *   hub; `today` answers the whole queue.
 * - `ReviewScheduleService.onActivityGraded(learnerId, lessonId, version)` is the producer of Essentials: the attempt capability
 *   calls it after it stored a graded attempt; when every required activity of the lesson version is graded the lesson is
 *   complete and its retrieval items are scheduled 1, 7 and 21 days later (`enqueueLesson` does the scheduling for a known
 *   completion). Review schedules nothing else from a lesson.
 * - `ReviewImportService` imports deck folders of starci-lab/data as immutable versions (the cli `review import`).
 * - Reviews report the day to the streak (`review-due-done`, once a day) when the last item due is graded.
 * - The scheduler is a port behind one interface; the module binds the fixed ladder (1, 3, 7, 14, 30, 60, 120, 180 days).
 */
export { REVIEW_ERROR_KINDS } from "./errors/review.error"
export { REVIEW_MESSAGES } from "./messages/review.messages"
export { reviewEntities, reviewMigrations } from "./persistence/connection"
export { ReviewDeckService } from "./review-deck.service"
export { ReviewGradeService } from "./review-grade.service"
export { ReviewImportService } from "./review-import.service"
export { ReviewItemService } from "./review-item.service"
export { ReviewModule } from "./review.module"
export { ReviewQueueService } from "./review-queue.service"
export { ReviewScheduleService } from "./review-schedule.service"
export type {
    ReviewClozeResult,
    ReviewDeckAddedView,
    ReviewDeckRemovedView,
    ReviewDeckView,
    ReviewFlipView,
    ReviewGoalSetView,
    ReviewGradeView,
    ReviewItemView,
    LessonReviewSlotView,
    ReviewLocale,
    ReviewStatsView,
    ReviewTodayView,
} from "./review.contracts"
