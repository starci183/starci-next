import { isRecord } from "@modules/platform/primitives"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import type { InterviewerDecision } from "./interview.contracts"

/** The longest thing the interviewer may say in one turn. */
export const MAX_INTERVIEWER_TEXT = 600

const invalid = (cause?: unknown): InterviewError =>
    new InterviewError({ code: InterviewErrorCode.CoachInvalid, cause })

/** The object a model wrote: the whole text, or the part between the first `{` and the last `}` when it wrapped the JSON. */
export const objectTextOf = (text: string): string => {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    return start === -1 || end < start ? text : text.slice(start, end + 1)
}

/** Parses the text of a model into JSON, or fails as INTERVIEW_COACH_INVALID. */
export const parsedJsonOf = (text: string): unknown => {
    try {
        return JSON.parse(objectTextOf(text))
    } catch (cause) {
        throw invalid(cause)
    }
}

/**
 * Reads what a model answered as the interviewer's decision: an action and the words to say. A follow-up or probe needs words
 * within the limit; moving on says nothing. Anything else is INTERVIEW_COACH_INVALID and nothing is stored.
 */
export const interviewerDecisionOf = (text: string): InterviewerDecision => {
    const body = parsedJsonOf(text)
    if (!isRecord(body)) throw invalid()
    const { action, text: said } = body
    if (action !== "followUp" && action !== "probe" && action !== "next") throw invalid()
    const words = typeof said === "string" ? said.trim() : ""
    if (action === "next") return { action, text: "" }
    if (words === "" || words.length > MAX_INTERVIEWER_TEXT) throw invalid()
    return { action, text: words }
}
