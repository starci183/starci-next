/** The browser's local storage, or null where there is none (server render, storage blocked by the browser). */
const localStorageOrNull = (): Storage | null => {
    if (typeof window === "undefined") return null
    try {
        return window.localStorage
    } catch {
        return null
    }
}

/** The key the time spent on a lesson is kept under. */
const keyOf = (lessonId: string): string => `starci.courseLesson.spent.${lessonId}`

/** The milliseconds the learner spent on a lesson in earlier visits; zero when the browser kept nothing. */
export const spentMsOf = (lessonId: string): number => {
    try {
        const stored = Number(localStorageOrNull()?.getItem(keyOf(lessonId)))
        return Number.isFinite(stored) && stored > 0 ? stored : 0
    } catch {
        return 0
    }
}

/** Keeps the time spent for the next visit; answers false when the browser keeps nothing (the time is then counted for this visit only). */
export const keepSpentMs = (lessonId: string, ms: number): boolean => {
    const storage = localStorageOrNull()
    if (storage === null) return false
    try {
        storage.setItem(keyOf(lessonId), String(Math.round(ms)))
        return true
    } catch {
        return false
    }
}
