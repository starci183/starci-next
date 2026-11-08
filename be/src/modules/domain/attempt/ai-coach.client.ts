import { Injectable } from "@nestjs/common"
import { AiGatewayError, AiGatewayErrorCode, InjectAiGateway, type AiGateway } from "@modules/integrations/ai-gateway"
import type { AttemptCoach } from "./attempt-coach.port"
import type { CoachGrade, CoachGradeRequest } from "./attempt.contracts"
import { coachPromptOf } from "./coach-prompt.policy"
import { coachGradeOf } from "./coach-reply.policy"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/** The code the attempt capability gives a gateway that failed: no pool declared, or a pool that did not answer. */
const codeOf = (cause: unknown): AttemptErrorCode =>
    cause instanceof AiGatewayError && cause.code === AiGatewayErrorCode.NotConfigured
        ? AttemptErrorCode.CoachUnconfigured
        : AttemptErrorCode.CoachUnavailable

@Injectable()
/** The coach of the app: the rubric and the quoted answer go to the model, the per-criterion levels come back. */
export class AiCoachClient implements AttemptCoach {
    constructor(@InjectAiGateway() private readonly gateway: AiGateway) {}

    /**
     * Asks the model to grade the answer under the deadline of the request. A gateway with no pool is
     * ATTEMPT_COACH_UNCONFIGURED, one that fails is ATTEMPT_COACH_UNAVAILABLE and a text that is not a grade is
     * ATTEMPT_COACH_INVALID; the model never sees a learner.
     */
    async grade(request: CoachGradeRequest): Promise<CoachGrade> {
        const prompt = coachPromptOf(request)
        const reply = await this.gateway
            .complete({
                requestId: request.requestId,
                system: prompt.system,
                user: prompt.user,
                timeoutMs: request.timeoutMs,
            })
            .catch((cause: unknown) => {
                throw new AttemptError({ code: codeOf(cause), cause })
            })
        return coachGradeOf(reply.text)
    }
}
