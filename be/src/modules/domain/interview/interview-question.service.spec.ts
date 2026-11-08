import { mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { sessionQuestionOf } from "@tests/fixtures/builders/interview.builder"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { InterviewQuestionService } from "./interview-question.service"
import { SELECT_GRADING_QUESTIONS, SELECT_SESSION_QUESTIONS } from "./persistence/interview.sql"

const drawn = [
    sessionQuestionOf(),
    sessionQuestionOf({ position: 1, bankId: "eq/1", bankVersion: "v2", questionId: "eq/1/0" }),
]
const keys = [
    ["0-fullstack-mastery/0-framework-foundation", "eq/1"],
    ["v1", "v2"],
    [drawn[0]?.questionId, "eq/1/0"],
]

const build = async () => {
    const em = mockEntityManager({
        query: [
            [SELECT_SESSION_QUESTIONS, [{ question_id: "public" }]],
            [SELECT_GRADING_QUESTIONS, [{ question_id: "grading" }]],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [InterviewQuestionService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
    }).compile()
    return { service: moduleRef.get(InterviewQuestionService), em }
}

describe("InterviewQuestionService", () => {
    it("reads the public material of the questions a session drew by bank, version and question", async () => {
        const { service, em } = await build()

        await expect(service.publicOf(drawn)).resolves.toEqual([{ question_id: "public" }])
        expect(em.query).toHaveBeenCalledWith(SELECT_SESSION_QUESTIONS, keys)
    })

    it("reads through the manager of a transaction when given one", async () => {
        const { service } = await build()
        const other = mockEntityManager({ query: [[SELECT_SESSION_QUESTIONS, []]] })

        await service.publicOf(drawn, other)

        expect(other.query).toHaveBeenCalledTimes(1)
    })

    it("reads the grading data only through its own door", async () => {
        const { service, em } = await build()

        await expect(service.gradingOf(drawn)).resolves.toEqual([{ question_id: "grading" }])
        expect(em.query).toHaveBeenCalledWith(SELECT_GRADING_QUESTIONS, keys)
    })
})
