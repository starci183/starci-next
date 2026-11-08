import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import {
    AiGatewayError,
    AiGatewayErrorCode,
    InjectAiGateway,
    type AiGateway,
    type AiGatewayReply,
} from "@modules/integrations/ai-gateway"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import type { ProjectCodeReadGrade, ProjectCodeReadRequest } from "./project-params.contracts"
import type { ProjectCoach } from "./project-coach.port"
import { codeReadGradeOf, codeReadPromptOf, type CodeReadPrompt } from "./project-coach.policy"

/**
 * The tokens one code read may produce, per attempt: a grade per criterion and one question, plus the room a reasoning model spends
 * thinking before it answers. A ceiling that is too low is spent on reasoning and leaves the text empty, so an empty reply is
 * asked again once with twice the room.
 */
const READ_TOKENS = 4000
const READ_TOKENS_RETRY = 8000

/** The code the project capability gives a gateway that failed: no pool declared, or a pool that did not answer. */
const codeOf = (cause: unknown): ProjectErrorCode => {
    if (!(cause instanceof AiGatewayError)) return ProjectErrorCode.CoachUnavailable
    if (cause.code === AiGatewayErrorCode.NotConfigured) return ProjectErrorCode.CoachUnconfigured
    // A model that answered with nothing is a text that is not a grade, not an outage.
    return cause.code === AiGatewayErrorCode.ReplyEmpty
        ? ProjectErrorCode.CoachInvalid
        : ProjectErrorCode.CoachUnavailable
}

/** The marks that fence the learner text: random per request, so no text can close the fence. */
const newFence = (): string => `LEARNER-${randomBytes(8).toString("hex").toUpperCase()}`

@Injectable()
/** The AI teacher of the app: the rubric goes in the instructions, the explanation and the code go to the model as fenced quoted data. */
export class AiProjectCoachClient implements ProjectCoach {
    constructor(@InjectAiGateway() private readonly gateway: AiGateway) {}

    /**
     * Asks the model to grade the explanation under the deadline of the request. A gateway with no pool is
     * PROJECT_COACH_UNCONFIGURED, one that fails is PROJECT_COACH_UNAVAILABLE and a text that is not a grade is
     * PROJECT_COACH_INVALID; the model never sees a learner.
     */
    async read(request: ProjectCodeReadRequest): Promise<ProjectCodeReadGrade> {
        const prompt = codeReadPromptOf(request, newFence())
        const reply = await this.complete(request, prompt, READ_TOKENS)
        return codeReadGradeOf(reply.text, request)
    }

    /** One gateway call with the budget of the attempt; an empty reply (the budget went to reasoning) is retried with the larger budget. */
    private async complete(
        request: ProjectCodeReadRequest,
        prompt: CodeReadPrompt,
        budget: number,
    ): Promise<AiGatewayReply> {
        try {
            return await this.gateway.complete({
                requestId: request.requestId,
                system: prompt.system,
                user: prompt.user,
                timeoutMs: request.timeoutMs,
                profile: "coach",
                maxOutputTokens: budget,
            })
        } catch (cause: unknown) {
            const empty = cause instanceof AiGatewayError && cause.code === AiGatewayErrorCode.ReplyEmpty
            if (empty && budget < READ_TOKENS_RETRY) return this.complete(request, prompt, READ_TOKENS_RETRY)
            throw new ProjectError({ code: codeOf(cause), cause })
        }
    }
}
