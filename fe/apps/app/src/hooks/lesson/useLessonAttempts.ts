"use client"

import { useState } from "react"
import { useGetLessonAttemptSwr, usePostLessonAttemptSwr } from "@/hooks/swr"
import { isPremiumRequired, isRevisionConflict } from "@/modules/failure"
import type { AttemptAnswer, AttemptStatus, AttemptView } from "@/modules/types"

/** One pick graded wrong: the option, the explanation the grade released for it and the revision it was sent under. */
export type AttemptMiss = { readonly optionId: string; readonly explanation: string; readonly revision: number }

/** One activity attempt: where it stands, the revision, the answer it carried and what the server said. */
export type AttemptState = {
    readonly status: AttemptStatus
    /** True when the last send of this answer was rejected by the transport; false once a new send starts or settles. */
    readonly isSendFailed: boolean
    readonly revision: number
    /** The answer as text, to tell a retry of the same answer from a new answer. */
    readonly answerKey: string
    readonly view: AttemptView | undefined
    /** The picks of this activity graded wrong, oldest first (a choice graded one pick at a time may be picked again). */
    readonly misses: ReadonlyArray<AttemptMiss>
}

/** What a submit asks: the lesson at its version, the activity and the answer. */
export type SubmitRequest = {
    readonly lessonId: string
    readonly version: string
    readonly locale: string
    readonly activityId: string
    readonly answer: AttemptAnswer
}

/** What useLessonAttempts answers: the attempt of each activity and the command that saves one. */
export type LessonAttempts = {
    readonly attempts: Readonly<Record<string, AttemptState>>
    /** Saves an answer; `onSettled` hears the attempt once the server answered it (a choice is graded by then). */
    readonly submit: (request: SubmitRequest, onSettled?: (view: AttemptView) => void) => void
}

/** The wrong picks with this attempt's pick added when its grade says wrong (once per option). */
const missesWith = (misses: ReadonlyArray<AttemptMiss>, view: AttemptView): ReadonlyArray<AttemptMiss> => {
    if (view.result?.correct !== false || misses.some((miss) => miss.optionId === view.answer.optionId)) return misses
    const explanation = view.result.options.find((option) => option.selected)?.explanation ?? ""
    return [...misses, { optionId: view.answer.optionId, explanation, revision: view.revision }]
}

/** The state an attempt is in once the server has answered. */
const settledOf = (view: AttemptView, answerKey: string, misses: ReadonlyArray<AttemptMiss> = []): AttemptState => ({
    status: view.status,
    isSendFailed: false,
    revision: view.revision,
    answerKey,
    view,
    misses: missesWith(misses, view),
})

/** The revision the next submit takes: the same one for a failed grading sent again unchanged, the next one otherwise. */
const nextRevisionOf = (previous: AttemptState | undefined, answerKey: string): number => {
    if (previous === undefined) return 1
    const isRetry = previous.answerKey === answerKey && previous.status === "failed"
    return isRetry ? previous.revision : previous.revision + 1
}

/** The attempts the server already holds, as the states they stand in. */
const restoredStatesOf = (restored: Readonly<Record<string, AttemptView>>): Readonly<Record<string, AttemptState>> =>
    Object.fromEntries(Object.entries(restored).map(([activityId, view]) => [activityId, settledOf(view, "")]))

/** The attempts as sent, with the one the server settled while it was being read again. */
const settledByPoll = (
    sent: Readonly<Record<string, AttemptState>>,
    polled: AttemptView | undefined,
): Readonly<Record<string, AttemptState>> => {
    if (polled === undefined || polled.status === "grading") return sent
    const own = sent[polled.activityId]
    return { ...sent, [polled.activityId]: settledOf(polled, own?.answerKey ?? "", own?.misses) }
}

/** One send of an answer; the wrong picks made before it ride along, so a pick that was wrong stays known. */
type Send = {
    readonly request: SubmitRequest
    readonly revision: number
    readonly answerKey: string
    readonly canBump: boolean
    readonly misses: ReadonlyArray<AttemptMiss>
    readonly onSettled: ((view: AttemptView) => void) | undefined
}

/**
 * The attempts of a lesson: the ones the server already holds (`restored`, read again after every submit) and the ones sent in this visit,
 * which win while they are newer. A new answer takes the next revision; resending a failed grading keeps its revision, and a
 * revision the server refuses (ATTEMPT_REVISION_CONFLICT) is bumped once and sent again. An attempt that is grading is read
 * again until the server settles it. PREMIUM_REQUIRED is read by its stable code, never by the status. The picks graded wrong are
 * kept per activity, so a choice picked again still shows why the earlier picks were wrong.
 */
export const useLessonAttempts = (restored: Readonly<Record<string, AttemptView>>): LessonAttempts => {
    const [sent, setSent] = useState<Readonly<Record<string, AttemptState>>>({})
    const post = usePostLessonAttemptSwr()
    const grading = Object.values(sent).find((each) => each.status === "grading")
    const polled = useGetLessonAttemptSwr(grading?.view?.attemptId).data
    const attempts = { ...restoredStatesOf(restored), ...settledByPoll(sent, polled) }

    const settle = (activityId: string, state: AttemptState): void =>
        setSent((all) => ({ ...all, [activityId]: state }))

    const send = (each: Send): void => {
        const { request, revision, answerKey, misses } = each
        settle(request.activityId, {
            status: "pending",
            isSendFailed: false,
            revision,
            answerKey,
            view: undefined,
            misses,
        })
        post.trigger({ ...request, revision })
            .then((view) => {
                settle(request.activityId, settledOf(view, answerKey, misses))
                each.onSettled?.(view)
            })
            .catch((error: unknown) => {
                if (each.canBump && isRevisionConflict(error)) {
                    send({ ...each, revision: revision + 1, canBump: false })
                    return
                }
                settle(request.activityId, {
                    status: isPremiumRequired(error) ? "premium" : "idle",
                    isSendFailed: !isPremiumRequired(error),
                    revision,
                    answerKey,
                    view: undefined,
                    misses,
                })
            })
    }

    const submit = (request: SubmitRequest, onSettled?: (view: AttemptView) => void): void => {
        const answerKey = JSON.stringify(request.answer)
        const previous = attempts[request.activityId]
        send({
            request,
            revision: nextRevisionOf(previous, answerKey),
            answerKey,
            canBump: true,
            misses: previous?.misses ?? [],
            onSettled,
        })
    }

    return { attempts, submit }
}
