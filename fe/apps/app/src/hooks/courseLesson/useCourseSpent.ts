"use client"

import { useEffect, useState } from "react"
import { keepSpentMs, spentMsOf } from "@/modules/course-lesson"

/** How often the time spent on the page is counted and kept. */
const TICK_MS = 15_000

/**
 * The milliseconds the learner spent on a lesson across visits: counted only while the page is visible, kept in the browser every
 * fifteen seconds and when the page closes. The submission carries it.
 */
export const useCourseSpent = (lessonId: string): number => {
    const [spent, setSpent] = useState(() => spentMsOf(lessonId))
    useEffect(() => {
        let total = spentMsOf(lessonId)
        let last = Date.now()
        const tick = (): void => {
            const now = Date.now()
            if (document.visibilityState === "visible") total += now - last
            last = now
            keepSpentMs(lessonId, total)
            setSpent(total)
        }
        const timer = setInterval(tick, TICK_MS)
        return () => {
            clearInterval(timer)
            tick()
        }
    }, [lessonId])
    return spent
}
