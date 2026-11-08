const DAY_MS = 86_400_000

/** Ho Chi Minh City is UTC+7 all year. */
const OFFSET_MS = 7 * 3_600_000

/** The calendar day (Asia/Ho_Chi_Minh, YYYY-MM-DD) an instant falls on. */
export const dayOf = (at: Date): string => new Date(at.getTime() + OFFSET_MS).toISOString().slice(0, 10)

/** The day `count` days after (or before, when negative) a day. */
export const addDays = (day: string, count: number): string =>
    new Date(Date.parse(`${day}T00:00:00Z`) + count * DAY_MS).toISOString().slice(0, 10)

/** The earlier of two days. */
export const earlierDay = (first: string, second: string): string => {
    if (first < second) return first
    return second
}

/** The later of two days. */
export const laterDay = (first: string, second: string): string => {
    if (first > second) return first
    return second
}

/** The Monday of the week a day belongs to. */
export const weekStartOf = (day: string): string => {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay()
    return addDays(day, -((weekday + 6) % 7))
}

/** The days from `from` to `to`, both included; empty when `to` is before `from`. */
export const daysBetween = (from: string, to: string): Array<string> => {
    const days: Array<string> = []
    for (let day = from; day <= to; day = addDays(day, 1)) days.push(day)
    return days
}
