import { Injectable } from "@nestjs/common"
import type { AttemptCoach } from "./attempt-coach.port"
import type { CoachGrade, CoachGradeRequest } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

@Injectable()
/** The coach of an app that configured no AI provider: it grades nothing and says so with a stable code. */
export class UnconfiguredCoachClient implements AttemptCoach {
    /** Always refuses with ATTEMPT_COACH_UNCONFIGURED, so the answer stays saved and the attempt fails. */
    grade(_request: CoachGradeRequest): Promise<CoachGrade> {
        return Promise.reject(new AttemptError({ code: AttemptErrorCode.CoachUnconfigured }))
    }
}
