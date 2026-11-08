import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { behavioralMaterial, technicalMaterial } from "@tests/fixtures/builders/interview.builder"
import { AiGatewayError, AiGatewayErrorCode, type AiGateway } from "@modules/integrations/ai-gateway"
import { AiInterviewClient } from "./ai-interview.client"
import type { ChecklistItem } from "./interview.contracts"
import type { GraderRequest, GradingQuestion, InterviewerRequest } from "./interview-coach.contracts"

const build = async () => {
    const gateway = mock<AiGateway>()
    const moduleRef = await Test.createTestingModule({ providers: [AiInterviewClient] })
        .useMocker(() => gateway)
        .compile()
    return { coach: moduleRef.get(AiInterviewClient), gateway }
}

const interviewer: InterviewerRequest = {
    requestId: "s:1",
    locale: "en",
    family: "technical",
    prompt: "Where?",
    material: "",
    followUps: [],
    asked: 0,
    transcript: [{ role: "candidate", kind: "answer", content: "In the service." }],
    timeoutMs: 30_000,
}

const grader: GraderRequest = {
    requestId: "s",
    locale: "en",
    previousProblem: null,
    timeoutMs: 150_000,
    questions: [
        {
            position: 0,
            questionId: "t/0",
            family: "technical",
            kind: "theory",
            prompt: "Where?",
            material: technicalMaterial,
            idealAnswer: "service",
            transcript: [{ role: "candidate", kind: "answer", content: "In the service layer." }],
        },
        {
            position: 1,
            questionId: "eq/0",
            family: "behavioral",
            kind: "behavioral",
            prompt: "Story?",
            material: behavioralMaterial,
            idealAnswer: "",
            transcript: [{ role: "candidate", kind: "answer", content: "I ran a test." }],
        },
    ],
}

const reading = (hit: boolean, quote: string) =>
    JSON.stringify({
        questions: [
            {
                position: 0,
                checklist: [
                    { item: 0, hit, evidenceQuote: quote },
                    { item: 1, hit: false, evidenceQuote: "" },
                ],
                dimensions: [],
                ownershipWeak: false,
                note: "n",
            },
            {
                position: 1,
                checklist: [],
                dimensions: behavioralMaterial.star.map((line) => ({
                    key: line.key,
                    level: 2,
                    evidenceQuote: "ran a test",
                })),
                ownershipWeak: false,
                note: "",
            },
        ],
    })

describe("AiInterviewClient decide", () => {
    it("asks the coach profile for a short decision under the deadline and answers it, with a fence the learner cannot know", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValue({
            text: '{"action":"probe","text":"Be specific."}',
            model: "m",
            usedFallback: false,
        })

        await expect(coach.decide(interviewer)).resolves.toEqual({ action: "probe", text: "Be specific." })

        const request = gateway.complete.mock.calls[0]?.[0]
        expect(request).toMatchObject({ requestId: "s:1", timeoutMs: 30_000, profile: "coach", maxOutputTokens: 1500 })
        expect(request?.system).toMatch(/BEGIN LEARNER-[0-9A-F]{16} and END LEARNER-[0-9A-F]{16}/u)
    })

    it("fails as unconfigured when the gateway has no pool, as unavailable when it fails, and as invalid for a text that is not a decision", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValueOnce(new AiGatewayError({ code: AiGatewayErrorCode.NotConfigured }))
        gateway.complete.mockRejectedValueOnce(new Error("down"))
        gateway.complete.mockResolvedValueOnce({ text: "no json", model: "m", usedFallback: false })

        await expect(coach.decide(interviewer)).rejects.toMatchObject({ code: "INTERVIEW_COACH_UNCONFIGURED" })
        await expect(coach.decide(interviewer)).rejects.toMatchObject({ code: "INTERVIEW_COACH_UNAVAILABLE" })
        await expect(coach.decide(interviewer)).rejects.toMatchObject({ code: "INTERVIEW_COACH_INVALID" })
    })
})

describe("AiInterviewClient grade", () => {
    it("reads a valid reply on the interview profile and names the model, marking a fallback", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValue({ text: reading(true, "service layer"), model: "flash", usedFallback: true })

        const reply = await coach.grade(grader)

        expect(reply.gradedBy).toEqual({ profile: "interview", model: "flash", usedFallback: true })
        expect(reply.questions).toHaveLength(2)
        expect(gateway.complete).toHaveBeenCalledTimes(1)
        expect(gateway.complete.mock.calls[0]?.[0]).toMatchObject({
            profile: "interview",
            timeoutMs: 150_000,
            maxOutputTokens: 6000 + 90 * 8 + 500,
        })
    })

    it("sends a refused reading back once with the reason and uses the second reading", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValueOnce({ text: reading(true, "never said"), model: "m", usedFallback: false })
        gateway.complete.mockResolvedValueOnce({
            text: reading(true, "service layer"),
            model: "m",
            usedFallback: false,
        })

        const reply = await coach.grade(grader)

        expect(reply.questions[0]?.checklist[0]?.hit).toBe(true)
        expect(gateway.complete.mock.calls[1]?.[0].user).toContain("Your previous answer was refused")
    })

    it("fails as invalid after two refused readings and keeps a gateway failure's own code", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockResolvedValue({ text: "nope", model: "m", usedFallback: false })
        await expect(coach.grade(grader)).rejects.toMatchObject({ code: "INTERVIEW_COACH_INVALID" })
        expect(gateway.complete).toHaveBeenCalledTimes(2)

        gateway.complete.mockReset()
        gateway.complete.mockRejectedValue(new Error("down"))
        await expect(coach.grade(grader)).rejects.toMatchObject({ code: "INTERVIEW_COACH_UNAVAILABLE" })
    })
})

describe("AiInterviewClient grade (continued)", () => {
    it("asks again with twice the tokens when a reasoning model spent its budget thinking and answered nothing", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValueOnce(new AiGatewayError({ code: AiGatewayErrorCode.ReplyEmpty }))
        gateway.complete.mockResolvedValueOnce({
            text: reading(true, "service layer"),
            model: "pro",
            usedFallback: false,
        })

        const reply = await coach.grade(grader)

        expect(reply.gradedBy.model).toBe("pro")
        expect(gateway.complete).toHaveBeenCalledTimes(2)
        expect(gateway.complete.mock.calls[1]?.[0].maxOutputTokens).toBe(2 * (6000 + 90 * 8 + 500))
        expect(gateway.complete.mock.calls[1]?.[0].user).toContain("the reply was empty")
    })

    it("is invalid when both tries answer nothing", async () => {
        const { coach, gateway } = await build()
        gateway.complete.mockRejectedValue(new AiGatewayError({ code: AiGatewayErrorCode.ReplyEmpty }))

        await expect(coach.grade(grader)).rejects.toMatchObject({ code: "INTERVIEW_COACH_INVALID" })
    })

    it("caps the output tokens", async () => {
        const { coach, gateway } = await build()
        const checklist = Array.from({ length: 200 }, (_, index): ChecklistItem => ({
            text: String(index),
            dimension: "technical",
            critical: false,
            scoreBand: 1,
        }))
        const big: GradingQuestion = {
            position: 0,
            questionId: "t/0",
            family: "technical",
            kind: "theory",
            prompt: "Where?",
            material: { ...technicalMaterial, checklist },
            idealAnswer: "service",
            transcript: [{ role: "candidate", kind: "answer", content: "In the service layer." }],
        }
        gateway.complete.mockResolvedValue({ text: "no", model: "m", usedFallback: false })

        await expect(coach.grade({ ...grader, questions: [big] })).rejects.toBeDefined()

        expect(gateway.complete.mock.calls[0]?.[0].maxOutputTokens).toBe(16_000)
    })
})
