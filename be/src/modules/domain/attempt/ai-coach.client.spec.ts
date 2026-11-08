import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { coachGradeOf, coachRequestOf } from "@tests/fixtures/builders/attempt.builder"
import { AiGatewayError, AiGatewayErrorCode, type AiGateway } from "@modules/integrations/ai-gateway"
import { AiCoachClient } from "./ai-coach.client"
import { coachPromptOf } from "./coach-prompt.policy"
import { AttemptErrorCode } from "./errors/attempt.error"

const build = async () => {
    const gateway = mock<AiGateway>()
    const moduleRef = await Test.createTestingModule({ providers: [AiCoachClient] })
        .useMocker(() => gateway)
        .compile()
    return { coach: moduleRef.get(AiCoachClient), gateway }
}

const request = coachRequestOf({
    rubric: [
        {
            id: "demo--interview--c1",
            criterion: "Names the lag",
            expectedEvidence: "the read model lags",
            misconception: "reads are instant",
            maxScore: 2,
        },
    ],
})

describe("AiCoachClient grade", () => {
    it("sends the prompt under the request deadline and answers the grade the model wrote", async () => {
        const { coach, gateway } = await build()
        const written = coachGradeOf({
            criteria: [{ criterionId: "demo--interview--c1", level: 2, evidenceQuote: "the read model lags" }],
        })
        gateway.complete.mockResolvedValue({ text: JSON.stringify(written), model: "m", usedFallback: false })

        const grade = await coach.grade(request)

        const prompt = coachPromptOf(request)
        expect(grade).toEqual(written)
        expect(gateway.complete).toHaveBeenCalledWith({
            requestId: request.requestId,
            system: prompt.system,
            user: prompt.user,
            timeoutMs: 60000,
        })
    })

    it.each([
        [new AiGatewayError({ code: AiGatewayErrorCode.NotConfigured }), AttemptErrorCode.CoachUnconfigured],
        [new AiGatewayError({ code: AiGatewayErrorCode.Unavailable }), AttemptErrorCode.CoachUnavailable],
        [new Error("pool down"), AttemptErrorCode.CoachUnavailable],
    ])("fails with the stable code of a gateway that fails with %p", async (cause, code) => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValue(cause)

        await expect(coach.grade(request)).rejects.toMatchObject({ code })
    })

    it("fails with ATTEMPT_COACH_INVALID when the model wrote something that is not a grade", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValue({ text: "I would give it a 2.", model: "m", usedFallback: false })

        await expect(coach.grade(request)).rejects.toMatchObject({ code: AttemptErrorCode.CoachInvalid })
    })
})
