import type { InterviewLocale } from "./interview.contracts"
import { INTERVIEW_SCRIPT } from "./messages/interview.messages"

/** What the interviewer says after the last question: no feedback, only what happens next. */
export const DONE_TEXT: Readonly<Record<InterviewLocale, string>> = INTERVIEW_SCRIPT.done

/** The text stored for a question the learner skipped. */
export const SKIPPED_TEXT: Readonly<Record<InterviewLocale, string>> = INTERVIEW_SCRIPT.skipped
