import { Injectable } from "@nestjs/common"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import type { InterviewCoach } from "./interview-coach.port"
import type { GraderReply, GraderRequest, InterviewerDecision, InterviewerRequest } from "./interview.contracts"

@Injectable()
/** The coach of an app that configured no AI provider: it asks and grades nothing and says so with a stable code. */
export class UnconfiguredInterviewClient implements InterviewCoach {
    /** Always refuses with INTERVIEW_COACH_UNCONFIGURED, so the answer stays saved. */
    decide(_request: InterviewerRequest): Promise<InterviewerDecision> {
        return Promise.reject(new InterviewError({ code: InterviewErrorCode.CoachUnconfigured }))
    }

    /** Always refuses with INTERVIEW_COACH_UNCONFIGURED, so the session stays submitted. */
    grade(_request: GraderRequest): Promise<GraderReply> {
        return Promise.reject(new InterviewError({ code: InterviewErrorCode.CoachUnconfigured }))
    }
}
