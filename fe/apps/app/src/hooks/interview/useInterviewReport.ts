"use client"

import { useState } from "react"
import { useMutateRegradeInterviewSwr, useQueryInterviewSessionSwr } from "@/hooks/swr"
import { interviewIssueOf, interviewIssueOfCode, type InterviewIssue } from "./interview.shared"

/** What the report holds and does. */
export type InterviewReportModel = {
    readonly session: ReturnType<typeof useQueryInterviewSessionSwr>
    readonly issue: InterviewIssue
    readonly isRegrading: boolean
    readonly regrade: () => void
}

/** The report of one session: the session read (the read refreshes itself while it is being graded) and the regrade of a failed grading. */
export const useInterviewReport = (sessionId: string): InterviewReportModel => {
    const session = useQueryInterviewSessionSwr(sessionId)
    const [issue, setIssue] = useState<InterviewIssue>("none")
    const { trigger, isMutating: isRegrading } = useMutateRegradeInterviewSwr()
    const { mutate } = session
    return {
        session,
        issue,
        isRegrading,
        regrade: () => {
            setIssue("none")
            trigger({ sessionId }).then(
                (result) => {
                    setIssue(interviewIssueOfCode(result.failureCode))
                    return mutate()
                },
                (error: unknown) => setIssue(interviewIssueOf(error)),
            )
        },
    }
}
