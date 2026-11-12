"use client"

import { useState } from "react"
import { useGetLessonAttemptSwr, usePostLessonAttemptSwr } from "@/hooks/swr"
import { isPremiumRequired, isRevisionConflict } from "@/modules/failure"
import type { AttemptAnswer, AttemptStatus, AttemptView } from "@/modules/types"

/** One activity attempt: where it stands, the revision, the answer it carried and what the server said. */
export type AttemptState = {
    readonly status: AttemptStatus
    /** True when the last send of this answer was rejected by the transport; false once a new send starts or settles. */
    readonly isSendFailed: boolean
    readonly revision: number
    /** The answer as text, to tell a retry of the same answer from a new answer. */
    readonly answerKey: string
    readonly view: AttemptView | undefined
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
    readonly submit: (request: SubmitRequest) => void
}

/** The state an attempt is in once the server has answered. */
const settledOf = (view: AttemptView, answerKey: string): AttemptState => ({
    status: view.status,
    isSendFailed: false,
    revision: view.revision,
    answerKey,
    view,
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
    return { ...sent, [polled.activityId]: settledOf(polled, sent[polled.activityId]?.answerKey ?? "") }
}

/**
 * The attempts of a lesson: the ones the server already holds (`restored`, read again after every submit) and the ones sent in this visit,
 * which win while they are newer. A new answer takes the next revision; resending a failed grading keeps its revision, and a
 * revision the server refuses (ATTEMPT_REVISION_CONFLICT) is bumped once and sent again. An attempt that is grading is read
 * again until the server settles it. PREMIUM_REQUIRED is read by its stable code, never by the status.
 */
export const useLessonAttempts = (restored: Readonly<Record<string, AttemptView>>): LessonAttempts => {
    const [sent, setSent] = useState<Readonly<Record<string, AttemptState>>>({})
    const post = usePostLessonAttemptSwr()
    const grading = Object.values(sent).find((each) => each.status === "grading")
    const polled = useGetLessonAttemptSwr(grading?.view?.attemptId).data
    const attempts = { ...restoredStatesOf(restored), ...settledByPoll(sent, polled) }

    const settle = (activityId: string, state: AttemptState): void =>
        setSent((all) => ({ ...all, [activityId]: state }))

    const send = (request: SubmitRequest, revision: number, answerKey: string, canBump: boolean): void => {
        settle(request.activityId, { status: "pending", isSendFailed: false, revision, answerKey, view: undefined })
        post.trigger({ ...request, revision })
            .then((view) => settle(request.activityId, settledOf(view, answerKey)))
            .catch((error: unknown) => {
                if (canBump && isRevisionConflict(error)) {
                    send(request, revision + 1, answerKey, false)
                    return
                }
                settle(request.activityId, {
                    status: isPremiumRequired(error) ? "premium" : "idle",
                    isSendFailed: !isPremiumRequired(error),
                    revision,
                    answerKey,
                    view: undefined,
                })
            })
    }

    const submit = (request: SubmitRequest): void => {
        const answerKey = JSON.stringify(request.answer)
        const previous = attempts[request.activityId]
        send(request, nextRevisionOf(previous, answerKey), answerKey, true)
    }

    return { attempts, submit }
}
