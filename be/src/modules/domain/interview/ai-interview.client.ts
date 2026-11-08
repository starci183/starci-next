import { randomBytes } from "node:crypto"
import { Injectable } from "@nestjs/common"
import {
    AiGatewayError,
    AiGatewayErrorCode,
    InjectAiGateway,
    type AiGateway,
    type AiGatewayReply,
} from "@modules/integrations/ai-gateway"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { graderPromptOf } from "./grader-prompt.policy"
import { graderReadingOf } from "./grader-reply.policy"
import type { InterviewCoach } from "./interview-coach.port"
import type { GraderReply, GraderRequest, InterviewerDecision, InterviewerRequest } from "./interview.contracts"
import { interviewerPromptOf } from "./interviewer-prompt.policy"
import { interviewerDecisionOf } from "./interviewer-reply.policy"

/** The system and user text of one model call. */
interface PromptText {
    /** The system text. */
    readonly system: string
    /** The user text. */
    readonly user: string
}

/** The gateway profile and the output budget of one model call. */
interface CompletionRoute {
    /** The gateway profile. */
    readonly profile: "coach" | "interview"
    /** The most tokens the reply may hold. */
    readonly maxOutputTokens: number
}

/** The tokens one interviewer turn may produce: a short sentence or two, plus room for a reasoning model to think first. */
const INTERVIEWER_MAX_TOKENS = 1500

/** The tokens the grader may produce: a base that covers a reasoning model's thinking, plus what it must write per checklist item or STAR dimension. */
const GRADER_BASE_TOKENS = 6000
const GRADER_TOKENS_PER_ITEM = 90
const GRADER_TOKENS_PER_QUESTION = 250
const GRADER_MAX_TOKENS = 16_000

/** The code the interview gives a gateway that failed: no pool declared, or a pool that did not answer. */
const codeOf = (cause: unknown): InterviewErrorCode =>
    cause instanceof AiGatewayError && cause.code === AiGatewayErrorCode.NotConfigured
        ? InterviewErrorCode.CoachUnconfigured
        : InterviewErrorCode.CoachUnavailable

/** Whether the gateway answered nothing: a reasoning model that spent its whole token budget thinking writes no text. */
const isEmptyReply = (cause: unknown): boolean =>
    cause instanceof InterviewError &&
    cause.cause instanceof AiGatewayError &&
    cause.cause.code === AiGatewayErrorCode.ReplyEmpty

/** The marks that fence the learner text: random per request, so no text can close the fence. */
const newFence = (): string => `LEARNER-${randomBytes(8).toString("hex").toUpperCase()}`

@Injectable()
/** The coach of the app: the interviewer decides the next turn and the grader reads a whole session, both through the AI gateway. */
export class AiInterviewClient implements InterviewCoach {
    constructor(@InjectAiGateway() private readonly gateway: AiGateway) {}

    /**
     * Asks the model what the interviewer says next under the deadline of the request. A gateway with no pool is
     * INTERVIEW_COACH_UNCONFIGURED, one that fails is INTERVIEW_COACH_UNAVAILABLE and a text that is not a decision is
     * INTERVIEW_COACH_INVALID. The model sees the public question and this question's transcript, never grading data.
     */
    async decide(request: InterviewerRequest): Promise<InterviewerDecision> {
        const prompt = interviewerPromptOf(request, newFence())
        const reply = await this.complete(request.requestId, prompt, request.timeoutMs, {
            profile: "coach",
            maxOutputTokens: INTERVIEWER_MAX_TOKENS,
        })
        return interviewerDecisionOf(reply.text)
    }

    /**
     * Asks the model to read the whole session once. A reading the checklist or the transcript refuses is sent back once with
     * the reason; a second refusal is INTERVIEW_COACH_INVALID. The reply also names the model that answered, for calibration.
     */
    async grade(request: GraderRequest): Promise<GraderReply> {
        const items = request.questions.reduce(
            (total, question) => total + question.material.checklist.length + question.material.star.length,
            0,
        )
        const maxOutputTokens = Math.min(
            GRADER_MAX_TOKENS,
            GRADER_BASE_TOKENS + items * GRADER_TOKENS_PER_ITEM + request.questions.length * GRADER_TOKENS_PER_QUESTION,
        )
        const asked = await this.reading(request, maxOutputTokens)
        if (asked.reading.kind === "read") return { questions: asked.reading.questions, gradedBy: asked.gradedBy }
        const again = await this.reading(
            { ...request, previousProblem: asked.reading.reason },
            Math.min(GRADER_MAX_TOKENS, maxOutputTokens * 2),
        )
        if (again.reading.kind === "read") return { questions: again.reading.questions, gradedBy: again.gradedBy }
        throw new InterviewError({ code: InterviewErrorCode.CoachInvalid })
    }

    private async reading(request: GraderRequest, maxOutputTokens: number) {
        const prompt = graderPromptOf(request, newFence())
        const gradedBy = { profile: "interview", model: "", usedFallback: false }
        try {
            const reply = await this.complete(request.requestId, prompt, request.timeoutMs, {
                profile: "interview",
                maxOutputTokens,
            })
            return {
                reading: graderReadingOf(reply.text, request.questions),
                gradedBy: { ...gradedBy, model: reply.model, usedFallback: reply.usedFallback },
            }
        } catch (cause) {
            if (!isEmptyReply(cause)) throw cause
            return { reading: { kind: "refused", reason: "the reply was empty" } as const, gradedBy }
        }
    }

    private complete(
        requestId: string,
        prompt: PromptText,
        timeoutMs: number,
        route: CompletionRoute,
    ): Promise<AiGatewayReply> {
        return this.gateway
            .complete({ requestId, system: prompt.system, user: prompt.user, timeoutMs, ...route })
            .catch((cause: unknown) => {
                throw new InterviewError({ code: codeOf(cause), cause })
            })
    }
}
