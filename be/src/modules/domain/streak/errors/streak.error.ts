import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the streak capability. */
export enum StreakErrorCode {
    /** The shard or the action kind is not one the streak counts. */
    ActionUnknown = "STREAK_ACTION_UNKNOWN",
    /** The weekly goal is outside 2 to 7 active days, or the reminder time is not HH:MM. */
    GoalInvalid = "STREAK_GOAL_INVALID",
}

/** How each streak code travels. */
export const STREAK_ERROR_KINDS: Record<StreakErrorCode, ErrorKind> = {
    [StreakErrorCode.ActionUnknown]: "invalid",
    [StreakErrorCode.GoalInvalid]: "invalid",
}

/** The one error class of the streak capability. */
export class StreakError extends DomainError<StreakErrorCode> {}
