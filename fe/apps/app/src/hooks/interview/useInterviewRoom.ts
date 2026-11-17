"use client"

import { navigation } from "@starci-next/i18n/navigation"
import type { MarkdownBlock } from "@starci-next/ui"
import { useCallback, useState } from "react"
import {
    useMutateAbandonInterviewSwr,
    useMutateAnswerInterviewSwr,
    useMutateInterviewHintSwr,
    useMutateRetryInterviewTurnSwr,
    useMutateSubmitInterviewSwr,
    useQueryInterviewSessionSwr,
    type InterviewSessionRead,
} from "@/hooks/swr"
import { APP_ROUTES, interviewReportPath } from "@/modules/routes"
import {
    interviewFactsOf,
    interviewIssueOf,
    interviewIssueOfCode,
    type InterviewFacts,
    type InterviewIssue,
} from "./interview.shared"

/** One turn of the conversation. */
export type InterviewTurnRead = InterviewSessionRead["turns"][number]

/** What the room holds and does. */
export type InterviewRoomModel = {
    readonly session: ReturnType<typeof useQueryInterviewSessionSwr>
    readonly draft: string
    /** The turns of the open question and the ones before it, in order. */
    readonly turns: ReadonlyArray<InterviewTurnRead>
    /** The code or diagram of the open question as blocks; empty when it has none. */
    readonly material: ReadonlyArray<MarkdownBlock>
    /** True when the last turn is an answer the interviewer has not replied to: the reply failed and can be asked again. */
    readonly needsReply: boolean
    /** True once the interviewer said the last question is over. */
    readonly isFinished: boolean
    /** True while the session still takes answers. */
    readonly isActive: boolean
    readonly hintsLeft: number
    readonly answeredCount: number
    readonly issue: InterviewIssue
    readonly isSending: boolean
    readonly isRetrying: boolean
    readonly isHinting: boolean
    readonly isGrading: boolean
    readonly isEndOpen: boolean
    readonly write: (text: string) => void
    readonly send: () => void
    readonly skip: () => void
    readonly hint: () => void
    readonly retry: () => void
    readonly submit: () => void
    readonly abandon: () => void
    readonly openEnd: (isOpen: boolean) => void
}

/** How a step reports: it clears the issue, runs, and words a refusal by its stable code. */
type Report = { readonly setIssue: (issue: InterviewIssue) => void }

type AnswerReport = Report & { readonly clearDraft: () => void }

type EndReport = Report & { readonly closeEnd: () => void }

/** The answer and the skip: the answer is stored first, then the interviewer replies. */
const useAnswerSteps = (
    sessionId: string,
    session: ReturnType<typeof useQueryInterviewSessionSwr>,
    facts: InterviewFacts,
    report: AnswerReport,
) => {
    const { trigger, isMutating } = useMutateAnswerInterviewSwr()
    const { position, answersHere } = facts
    const answer = useCallback(
        (text: string, isSkipped: boolean) => {
            report.setIssue("none")
            trigger({ sessionId, position, revision: answersHere, text, isSkipped }).then(
                (result) => {
                    report.clearDraft()
                    report.setIssue(interviewIssueOfCode(result.failureCode))
                    return session.mutate()
                },
                (error: unknown) => {
                    report.setIssue(interviewIssueOf(error))
                    return session.mutate()
                },
            )
        },
        [trigger, sessionId, position, answersHere, session, report],
    )
    return { answer, isSending: isMutating }
}

/** The hint and the retry of an interviewer step that failed. */
const useGuideSteps = (
    sessionId: string,
    session: ReturnType<typeof useQueryInterviewSessionSwr>,
    position: number,
    report: Report,
) => {
    const { trigger: triggerHint, isMutating: isHinting } = useMutateInterviewHintSwr()
    const { trigger: triggerRetry, isMutating: isRetrying } = useMutateRetryInterviewTurnSwr()
    return {
        isHinting,
        isRetrying,
        hint: () => {
            report.setIssue("none")
            triggerHint({ sessionId, position }).then(
                () => session.mutate(),
                (error: unknown) => report.setIssue(interviewIssueOf(error)),
            )
        },
        retry: () => {
            report.setIssue("none")
            triggerRetry({ sessionId }).then(
                (result) => {
                    report.setIssue(interviewIssueOfCode(result.failureCode))
                    return session.mutate()
                },
                (error: unknown) => report.setIssue(interviewIssueOf(error)),
            )
        },
    }
}

/** The end of the interview: grading the whole session, or abandoning it when nothing was answered. */
const useEndSteps = (sessionId: string, report: EndReport) => {
    const router = navigation.useRouter()
    const { trigger: triggerSubmit, isMutating: isGrading } = useMutateSubmitInterviewSwr()
    const { trigger: triggerAbandon } = useMutateAbandonInterviewSwr()
    return {
        isGrading,
        submit: () => {
            report.setIssue("none")
            report.closeEnd()
            triggerSubmit({ sessionId }).then(
                () => router.push(interviewReportPath(sessionId)),
                (error: unknown) => report.setIssue(interviewIssueOf(error)),
            )
        },
        abandon: () => {
            report.closeEnd()
            triggerAbandon({ sessionId }).then(
                () => router.push(APP_ROUTES.interview),
                (error: unknown) => report.setIssue(interviewIssueOf(error)),
            )
        },
    }
}

/**
 * The work of one learner in an interview room: the draft, the answer (stored first, then the interviewer replies), the hint, the
 * skip, a retry of an interviewer step that failed, and the end. What the session holds is the one truth: whether a reply is
 * missing is read from its turns, so a reload shows the same screen. A refused call becomes an issue worded by its stable code.
 */
export const useInterviewRoom = (sessionId: string): InterviewRoomModel => {
    const session = useQueryInterviewSessionSwr(sessionId)
    const [draft, setDraft] = useState("")
    const [issue, setIssue] = useState<InterviewIssue>("none")
    const [isEndOpen, setIsEndOpen] = useState(false)
    const facts = interviewFactsOf(session.data)
    const answers = useAnswerSteps(sessionId, session, facts, { setIssue, clearDraft: () => setDraft("") })
    const guide = useGuideSteps(sessionId, session, facts.position, { setIssue })
    const end = useEndSteps(sessionId, { setIssue, closeEnd: () => setIsEndOpen(false) })
    return {
        session,
        draft,
        turns: facts.turns,
        material: facts.material,
        needsReply: facts.needsReply,
        isFinished: facts.isFinished,
        isActive: facts.isActive,
        hintsLeft: facts.hintsLeft,
        answeredCount: facts.answeredCount,
        issue,
        isSending: answers.isSending,
        isRetrying: guide.isRetrying,
        isHinting: guide.isHinting,
        isGrading: end.isGrading,
        isEndOpen,
        write: setDraft,
        send: () => answers.answer(draft, false),
        skip: () => answers.answer("", true),
        hint: guide.hint,
        retry: guide.retry,
        submit: end.submit,
        abandon: end.abandon,
        openEnd: setIsEndOpen,
    }
}
