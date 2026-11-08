/** Vietnam keeps UTC+7 all year, with no daylight saving. */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

const pad = (value: number): string => String(value).padStart(2, "0")

/** The free-quota month of an instant: `YYYY-MM` in Asia/Ho_Chi_Minh. */
export const freeMonthOf = (instant: Date): string => {
    const local = new Date(instant.getTime() + VIETNAM_OFFSET_MS)
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}`
}

/** The first instant of the next month in Asia/Ho_Chi_Minh: when the free quota resets. */
export const nextResetOf = (instant: Date): Date => {
    const local = new Date(instant.getTime() + VIETNAM_OFFSET_MS)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - VIETNAM_OFFSET_MS)
}

/** The start of the UTC day of an instant: the window the fair-use cap counts. */
export const utcDayStartOf = (instant: Date): Date =>
    new Date(Date.UTC(instant.getUTCFullYear(), instant.getUTCMonth(), instant.getUTCDate()))
