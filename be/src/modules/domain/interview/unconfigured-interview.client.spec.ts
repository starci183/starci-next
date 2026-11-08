import { Test } from "@nestjs/testing"
import type { GraderRequest, InterviewerRequest } from "./interview.contracts"
import { UnconfiguredInterviewClient } from "./unconfigured-interview.client"

const interviewer: InterviewerRequest = {
    requestId: "s:1",
    locale: "en",
    family: "technical",
    prompt: "Where?",
    material: "",
    followUps: [],
    asked: 0,
    transcript: [],
    timeoutMs: 30_000,
}

const grader: GraderRequest = {
    requestId: "s",
    locale: "en",
    previousProblem: null,
    timeoutMs: 150_000,
    questions: [],
}

describe("UnconfiguredInterviewClient", () => {
    it("refuses both steps with INTERVIEW_COACH_UNCONFIGURED", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [UnconfiguredInterviewClient] }).compile()
        const client = moduleRef.get(UnconfiguredInterviewClient)

        await expect(client.decide(interviewer)).rejects.toMatchObject({ code: "INTERVIEW_COACH_UNCONFIGURED" })
        await expect(client.grade(grader)).rejects.toMatchObject({ code: "INTERVIEW_COACH_UNCONFIGURED" })
    })
})
