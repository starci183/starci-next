import { mock } from "@starci/jest-preset"
import { CourseCaseService, CourseErrorCode } from "@modules/domain/course"
import type { Logger } from "@modules/platform/logging"
import { caseEventInputOf, type CaseEvent } from "@modules/platform/relay-protocol"
import { UploadCourseCaseCommand } from "./upload-course-case.command"
import { UploadCourseCaseHandler } from "./upload-course-case.handler"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const EVENT = "0c9a2b1e-9a2c-4b6e-8f1a-2b3c4d5e6f70"
const TASK = "course:shop-giay/saga-compensation"
const AT = "2026-11-25T02:00:00.000Z"

const RESULT: CaseEvent = {
    type: "case.result",
    lessonId: "saga-compensation",
    caseId: "u1",
    kind: "unhappy",
    status: "red",
    ranAt: AT,
    durationMs: 900,
    learnerCommit: null,
    chaos: { STOCK_OUT: "1" },
    upTo: [{ caseId: "u1", status: "red" }],
    failed: { invariant: null, message: "wallet is 3.8m" },
}
const HINT: CaseEvent = { type: "case.hint", lessonId: "saga-compensation", caseId: "u1", level: 1, at: AT }
const RESET: CaseEvent = {
    type: "case.reset",
    lessonId: "saga-compensation",
    caseId: "u1",
    stashedBranch: "cua-toi-luu-u1",
    at: AT,
}

const world = () => {
    const cases = mock<CourseCaseService>()
    cases.recordCaseResult.mockResolvedValue({ recorded: true })
    cases.recordHint.mockResolvedValue({ recorded: true })
    cases.recordReset.mockResolvedValue({ recorded: true })
    return { handler: new UploadCourseCaseHandler(mock<Logger>(), cases), cases }
}

const commandOf = (event: CaseEvent, envelope = { eventId: EVENT, taskId: TASK }) => {
    const { mutation, input } = caseEventInputOf(event, envelope)
    return new UploadCourseCaseCommand({ request: { learnerId: LEARNER, mutation, input } })
}

describe("UploadCourseCaseHandler", () => {
    it("stores a case.result for the device's learner and answers the client event id as accepted", async () => {
        const { handler, cases } = world()

        await expect(handler.execute(commandOf(RESULT))).resolves.toEqual({ eventId: EVENT, accepted: true })

        expect(cases.recordCaseResult).toHaveBeenCalledWith(LEARNER, EVENT, RESULT)
    })

    it("stores a case.hint and a case.reset through their own methods", async () => {
        const { handler, cases } = world()

        await handler.execute(commandOf(HINT))
        await handler.execute(commandOf(RESET))

        expect(cases.recordHint).toHaveBeenCalledWith(LEARNER, HINT)
        expect(cases.recordReset).toHaveBeenCalledWith(LEARNER, RESET)
        expect(cases.recordCaseResult).not.toHaveBeenCalled()
    })

    it("answers accepted again for a resend the service already held", async () => {
        const { handler, cases } = world()
        cases.recordCaseResult.mockResolvedValue({ recorded: false })

        await expect(handler.execute(commandOf(RESULT))).resolves.toEqual({ eventId: EVENT, accepted: true })
    })

    it("refuses an input the relay protocol does not read, and a task that names another lesson", async () => {
        const { handler, cases } = world()
        const bad = new UploadCourseCaseCommand({
            request: {
                learnerId: LEARNER,
                mutation: "relayLabCaseHint",
                input: { eventId: EVENT, taskId: TASK, lessonId: "saga-compensation", caseId: "u1", level: 7, at: AT },
            },
        })
        const extra = new UploadCourseCaseCommand({
            request: {
                learnerId: LEARNER,
                mutation: "relayLabCaseReset",
                input: { ...commandOf(RESET).params.request.input, surprise: true },
            },
        })

        await expect(handler.execute(bad)).rejects.toMatchObject({ code: CourseErrorCode.PayloadInvalid })
        await expect(handler.execute(extra)).rejects.toMatchObject({ code: CourseErrorCode.PayloadInvalid })
        await expect(
            handler.execute(commandOf(RESULT, { eventId: EVENT, taskId: "course:shop-giay/other-lesson" })),
        ).rejects.toMatchObject({ code: CourseErrorCode.PayloadInvalid })
        await expect(
            handler.execute(commandOf(RESULT, { eventId: EVENT, taskId: "lab:shop-giay/saga-compensation" })),
        ).rejects.toMatchObject({ code: CourseErrorCode.PayloadInvalid })
        expect(cases.recordCaseResult).not.toHaveBeenCalled()
        expect(cases.recordHint).not.toHaveBeenCalled()
        expect(cases.recordReset).not.toHaveBeenCalled()
    })
})
