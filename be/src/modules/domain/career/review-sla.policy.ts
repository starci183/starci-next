import type { CareerSettings, ReviewSla } from "./career.contracts"
import type { CareerOptions } from "./career.options"

/** The offset of Asia/Ho_Chi_Minh, which keeps no daylight saving time. */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

/** One calendar day. */
const DAY_MS = 24 * 60 * 60 * 1000

/** Sunday and Saturday, as `getUTCDay` numbers them. */
const WEEKEND: ReadonlySet<number> = new Set([0, 6])

/** The proposed defaults of Q-CA-3, Q-CA-4, Q-CA-5 and Q-CA-8. */
export const DEFAULT_CAREER_SETTINGS: CareerSettings = {
    reviewWorkingDays: 3,
    reminderWorkingDays: 2,
    returnsBeforeTeacher: 3,
    teacherHoldDays: 7,
    reviewerCapacity: 30,
    hiringMinVerified: 3,
}

/** The settings the app registered, each falling back to its proposed default. */
export const careerSettingsOf = (options: CareerOptions): CareerSettings => ({
    reviewWorkingDays: options.reviewWorkingDays ?? DEFAULT_CAREER_SETTINGS.reviewWorkingDays,
    reminderWorkingDays: options.reminderWorkingDays ?? DEFAULT_CAREER_SETTINGS.reminderWorkingDays,
    returnsBeforeTeacher: options.returnsBeforeTeacher ?? DEFAULT_CAREER_SETTINGS.returnsBeforeTeacher,
    teacherHoldDays: options.teacherHoldDays ?? DEFAULT_CAREER_SETTINGS.teacherHoldDays,
    reviewerCapacity: options.reviewerCapacity ?? DEFAULT_CAREER_SETTINGS.reviewerCapacity,
    hiringMinVerified: options.hiringMinVerified ?? DEFAULT_CAREER_SETTINGS.hiringMinVerified,
})

/**
 * The instant `days` working days after `from` in Asia/Ho_Chi_Minh, at the same local time: Saturdays and Sundays are skipped,
 * public holidays are not known yet and count as working days.
 */
export const addWorkingDays = (from: Date, days: number): Date => {
    let local = from.getTime() + VIETNAM_OFFSET_MS
    let left = days
    while (left > 0) {
        local += DAY_MS
        if (!WEEKEND.has(new Date(local).getUTCDay())) left -= 1
    }
    return new Date(local - VIETNAM_OFFSET_MS)
}

/** The instant `days` calendar days after `from`. */
export const addCalendarDays = (from: Date, days: number): Date => new Date(from.getTime() + days * DAY_MS)

/** The deadline of a submit: the working-day SLA, or the teacher's calendar hold for an item returned too often. */
export const dueAtOf = (submittedAt: Date, teacherOnly: boolean, settings: CareerSettings): Date =>
    teacherOnly
        ? addCalendarDays(submittedAt, settings.teacherHoldDays)
        : addWorkingDays(submittedAt, settings.reviewWorkingDays)

/** Where a pending item stands: overdue past its deadline, due soon past the reminder, else on time. */
export const slaOf = (submittedAt: Date, dueAt: Date, now: Date, settings: CareerSettings): ReviewSla => {
    if (now.getTime() >= dueAt.getTime()) return "overdue"
    const remindAt = addWorkingDays(submittedAt, settings.reminderWorkingDays)
    return now.getTime() >= remindAt.getTime() ? "due-soon" : "on-time"
}
