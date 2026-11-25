import { mock } from "@starci/jest-preset"
import { CourseErrorCode, CourseRungService } from "@modules/domain/course"
import type { Logger } from "@modules/platform/logging"
import { caseEventInputOf, type CaseResetEvent } from "@modules/platform/relay-protocol"
import { ResetCourseRungCommand } from "@features/api/course/application/reset-course-rung.command"
import { ResetCourseRungHandler } from "@features/api/course/application/reset-course-rung.handler"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"
const TASK = "course:shop-giay/saga-compensation"
const RESET: CaseResetEvent = {
    type: "case.reset",
    lessonId: "saga-compensation",
    caseId: "u1",
    stashedBranch: "cua-toi-luu-u1",
    at: "2026-11-25T02:00:00.000Z",
}
const RUNG = {
    kind: "rung:c1-x",
    tag: "c1-x",
    path: "services/orders/src/saga.ts",
    content: "// c1\n",
    sha256: "a".repeat(64),
}

const world = () => {
    const rungs = mock<CourseRungService>()
    rungs.resetTo.mockResolvedValue(RUNG)
    return { handler: new ResetCourseRungHandler(mock<Logger>(), rungs), rungs }
}

const commandOf = (input: Readonly<Record<string, unknown>>) =>
    new ResetCourseRungCommand({ request: { learnerId: LEARNER, input } })

describe("ResetCourseRungHandler", () => {
    it("reads the case.reset upload with the protocol's schema, then records it and answers the rung", async () => {
        const { handler, rungs } = world()

        await expect(
            handler.execute(commandOf(caseEventInputOf(RESET, { eventId: EVENT, taskId: TASK }).input)),
        ).resolves.toEqual(RUNG)
        expect(rungs.resetTo).toHaveBeenCalledWith(LEARNER, RESET)
    })

    it("refuses a task id naming another lesson, a stashed branch off the protocol and an unknown field", async () => {
        const { handler, rungs } = world()
        const input = caseEventInputOf(RESET, { eventId: EVENT, taskId: TASK }).input

        for (const bad of [
            { ...input, taskId: "course:shop-giay/other-lesson" },
            { ...input, stashedBranch: "main" },
            { ...input, extra: "x" },
        ])
            await expect(handler.execute(commandOf(bad))).rejects.toEqual(
                expect.objectContaining({ code: CourseErrorCode.PayloadInvalid }),
            )
        expect(rungs.resetTo).not.toHaveBeenCalled()
    })
})
