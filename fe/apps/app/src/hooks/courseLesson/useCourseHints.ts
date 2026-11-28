"use client"

import { useCallback, useRef, useState } from "react"
import { useMutateOpenCourseHintSwr, useMutateOpenCourseSolutionSwr } from "@/hooks/swr"
import { isForbidden } from "@/modules/failure"
import { hintKeyOf, type OpenedHints, type OpeningHint } from "@/modules/course-lesson"

/** Why a hint did not open: the plan lacks it (the way to the plans follows) or anything else. */
export type CourseHintFailure = "premium" | "other"

/** The hints of the unhappy cases: the texts opened on this page, the level being opened and why the last one failed. */
export type CourseHints = {
    readonly opened: OpenedHints
    readonly opening: OpeningHint
    readonly failure: CourseHintFailure | undefined
    /** Opens one level of a case's ladder; the back end opens one level at a time and keeps the count. */
    readonly open: (caseId: string, level: number) => void
    /**
     * Records that the learner expanded a case's "Kẹt quá? Xem lời giải" the first time, so the server reveals its fix (owner 2026-11-28);
     * the page then reads the cases again, and the new mark reads the before-and-after block again. Once per case per page.
     */
    readonly openSolution: (caseId: string) => void
    readonly dismiss: () => void
}

/** What the hints need from the page: the lesson, the learner's language and what to read again once a hint opened. */
type CourseHintsParams = {
    readonly lessonId: string
    readonly locale: string
    readonly onOpened: () => void
}

/**
 * Opens the hints of a case through `openCourseHint`, one level at a time. The text comes back with the answer and stays on screen; the
 * page reads the lesson and the cases again, so the count the back end recorded is the one shown.
 */
export const useCourseHints = (params: CourseHintsParams): CourseHints => {
    const { lessonId, locale, onOpened } = params
    const opener = useMutateOpenCourseHintSwr()
    const { trigger } = opener
    const [opened, setOpened] = useState<OpenedHints>({})
    const [opening, setOpening] = useState<OpeningHint>(undefined)
    const [failure, setFailure] = useState<CourseHintFailure | undefined>(undefined)
    const open = useCallback(
        (caseId: string, level: number): void => {
            setFailure(undefined)
            setOpening({ caseId, level })
            trigger({ lessonId, caseId, level, locale })
                .then((hint) => {
                    setOpened((before) => ({ ...before, [hintKeyOf(hint.caseId, hint.level)]: hint.text }))
                    onOpened()
                })
                .catch((error: unknown) => setFailure(isForbidden(error) ? "premium" : "other"))
                .finally(() => setOpening(undefined))
        },
        [trigger, lessonId, locale, onOpened],
    )
    const { trigger: triggerSolution } = useMutateOpenCourseSolutionSwr()
    // The cases asked on this page: a second expand of the same disclosure sends nothing (the back end is idempotent anyway).
    const solutionsAsked = useRef<Set<string>>(new Set())
    const openSolution = useCallback(
        (caseId: string): void => {
            if (solutionsAsked.current.has(caseId)) return
            solutionsAsked.current.add(caseId)
            triggerSolution({ lessonId, caseId })
                .then(() => onOpened())
                .catch((error: unknown) => {
                    solutionsAsked.current.delete(caseId)
                    setFailure(isForbidden(error) ? "premium" : "other")
                })
        },
        [triggerSolution, lessonId, onOpened],
    )
    const dismiss = useCallback((): void => setFailure(undefined), [])
    return { opened, opening, failure, open, openSolution, dismiss }
}
