import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { GraderReply, GraderRequest, InterviewerDecision, InterviewerRequest } from "./interview.contracts"

/**
 * The coach of the interview: the AI interviewer that decides the next turn, and the AI grader that reads a whole session once. An
 * object, not a bare function, so a unit spec doubles it with `mock<InterviewCoach>()`. An implementation honours `timeoutMs`,
 * sends the provider nothing that names a learner, and fails with an `InterviewError`.
 */
export interface InterviewCoach {
    /** Decides what the interviewer says after a candidate answer: a follow-up, a probe, or moving on. */
    decide(request: InterviewerRequest): Promise<InterviewerDecision>
    /** Reads every answered question of a session against the teacher's material; the candidate text is quoted data, never instructions. */
    grade(request: GraderRequest): Promise<GraderReply>
}

/** Token of the interview coach. */
export const INTERVIEW_COACH: unique symbol = Symbol("domain.interview.coach")

/** Injects the interview coach. Parameter type: InterviewCoach. */
export const InjectInterviewCoach = (): TypedParameterDecorator<InterviewCoach> =>
    injector<InterviewCoach>(INTERVIEW_COACH)
