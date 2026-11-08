/**
 * The streak capability: the one streak of the whole app.
 *
 * Producer port, called by every learning part after it has stored a meaningful action (never from a client door):
 *
 *     StreakService.recordStreakAction(learnerId, shard, kind, ref?) => Promise<{ counted, day }>
 *
 * - `shard`: "essentials" | "review" | "practice" | "projects" | "incidents" | "interview" (`STREAK_SHARDS`, hub order).
 * - `kind`: "review-due-done" | "graded-attempt" | "project-run" | "interview-submitted".
 * - `ref`: `{ actionId?, sourceRef?, at? }`. Pass the stable id of the stored thing (attempt id, run id, session id, review day)
 *   as `actionId`: a repeat counts once and answers `counted: false`. Without an `actionId` each call is a new action.
 * - Throws STREAK_ACTION_UNKNOWN for a shard or kind it does not know.
 *
 * A day (Asia/Ho_Chi_Minh, weeks from Monday) counts only for these actions; page views, opening a lesson and flipping a card
 * never count. Missed days spend a held freeze (1 granted every Monday and 1 earned by meeting last week's goal, at most 2) or
 * reset the current streak; the longest never decreases. The default weekly goal is 4 active days (2 to 7). The rules are
 * `StreakModule.register({ rules })` options. The streak never creates or verifies an experience item.
 *
 * Readers: `summary(learnerId)` and `setGoal(learnerId, { activeDays, reminder? })`.
 */
export { STREAK_ERROR_KINDS } from "./errors/streak.error"
export { STREAK_MESSAGES } from "./messages/streak.messages"
export { streakEntities, streakMigrations } from "./persistence/connection"
export { STREAK_SHARD_IDS } from "./streak.contracts"
export { addDays, dayOf } from "./streak-day.policy"
export type { StreakGoalView, StreakReminder, StreakShard, StreakSummary } from "./streak.contracts"
export { StreakModule } from "./streak.module"
export { StreakService } from "./streak.service"
