import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { AiGatewayError, AiGatewayErrorCode, type AiGateway } from "@modules/integrations/ai-gateway"
import { AiProjectCoachClient } from "./ai-project-coach.client"
import type { ProjectCodeReadRequest } from "./project-params.contracts"

const REQUEST: ProjectCodeReadRequest = {
    requestId: "read-1",
    locale: "en",
    concept: "Idempotency",
    rubric: [{ id: "c1", criterion: "Names the key", expectedEvidence: "a key", misconception: "none" }],
    location: "a.go",
    excerpt: "func a() { store(key) }",
    explanation: "The key identifies the call. The first result is stored.",
    timeoutMs: 5000,
}

const build = async () => {
    const gateway = mock<AiGateway>()
    const moduleRef = await Test.createTestingModule({ providers: [AiProjectCoachClient] })
        .useMocker(() => gateway)
        .compile()
    return { coach: moduleRef.get(AiProjectCoachClient), gateway }
}

describe("AiProjectCoachClient read", () => {
    it("sends the fenced prompt under the deadline of the request and reads the grade", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValue({
            text: JSON.stringify({
                criteria: [{ criterionId: "c1", level: 2, evidenceQuote: "store(key)" }],
                question: "Where?",
            }),
            model: "m",
            usedFallback: false,
        })

        await expect(coach.read(REQUEST)).resolves.toEqual({
            criteria: [{ criterionId: "c1", level: 2, evidenceQuote: "store(key)" }],
            question: "Where?",
        })

        const sent = gateway.complete.mock.calls[0]?.[0]
        expect(sent).toMatchObject({ requestId: "read-1", timeoutMs: 5000, profile: "coach", maxOutputTokens: 4000 })
        expect(sent?.system).toMatch(/BEGIN LEARNER-[0-9A-F]{16} and END LEARNER-[0-9A-F]{16}/u)
        expect(sent?.user).toContain("store(key)")
    })

    it("refuses with PROJECT_COACH_UNCONFIGURED when the gateway has no pool", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValue(new AiGatewayError({ code: AiGatewayErrorCode.NotConfigured }))

        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_UNCONFIGURED" })
    })

    it("refuses with PROJECT_COACH_UNAVAILABLE when the pool fails, and PROJECT_COACH_INVALID on a text that is not a grade", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValueOnce(new Error("down"))
        gateway.complete.mockResolvedValueOnce({ text: "no", model: "m", usedFallback: false })

        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_UNAVAILABLE" })
        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_INVALID" })
    })

    it("refuses with PROJECT_COACH_UNAVAILABLE when the gateway names its own outage", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValue(new AiGatewayError({ code: AiGatewayErrorCode.Unavailable }))

        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_UNAVAILABLE" })
    })

    it("asks again with twice the room when the model answered with nothing, and refuses with PROJECT_COACH_INVALID when it stays empty", async () => {
        const { coach, gateway } = await build()
        const empty = new AiGatewayError({ code: AiGatewayErrorCode.ReplyEmpty })
        gateway.complete.mockRejectedValueOnce(empty)
        gateway.complete.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [{ criterionId: "c1", level: 2, evidenceQuote: "store(key)" }],
                question: "Where?",
            }),
            model: "m",
            usedFallback: false,
        })

        await expect(coach.read(REQUEST)).resolves.toMatchObject({ question: "Where?" })
        expect(gateway.complete.mock.calls.map(([sent]) => sent.maxOutputTokens)).toEqual([4000, 8000])

        gateway.complete.mockRejectedValue(empty)
        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_INVALID" })
    })

    it("refuses with PROJECT_COACH_UNCONFIGURED when the gateway has no pool, without asking again", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValue(new AiGatewayError({ code: AiGatewayErrorCode.NotConfigured }))

        await expect(coach.read(REQUEST)).rejects.toMatchObject({ code: "PROJECT_COACH_UNCONFIGURED" })
        expect(gateway.complete).toHaveBeenCalledTimes(1)
    })
})
