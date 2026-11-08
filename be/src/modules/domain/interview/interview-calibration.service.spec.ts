import { DEFAULT_INTERVIEW_SETTINGS } from "./interview.config"
import type { InterviewSettings } from "./interview.options"
import { FakeClock, fakeTransaction, mock, mockEntityManager, builder } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { questionDraftOf } from "@tests/fixtures/builders/interview.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { InterviewCalibrationService } from "./interview-calibration.service"
import { INTERVIEW_COACH, type InterviewCoach } from "./interview-coach.port"
import { INTERVIEW_RESOLVED_OPTIONS } from "./interview.decorators"
import type { GraderReply } from "./interview.contracts"
import { InterviewLogEvent } from "./interview.log-events"
import {
    PUBLISH_BANK,
    SELECT_CALIBRATION_QUESTIONS,
    SELECT_VALIDATED_BANKS,
    SUPERSEDE_BANK,
} from "./persistence/interview.sql"
import { LAYER_QUESTION_VI } from "@tests/fixtures/i18n/interview-spec.messages"
import { firstParamsOf, storedJsonOf } from "@tests/fixtures/builders/interview-stub.builder"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const draft = questionDraftOf()
const BANK = "0-fullstack-mastery/0-framework-foundation"

const row = {
    question_id: draft.questionId,
    family: "technical",
    kind: "theory",
    bodies: draft.bodies,
    grading: draft.grading,
}

const reading = (hits: ReadonlyArray<boolean>): GraderReply => ({
    questions: [
        {
            position: 0,
            checklist: hits.map((hit, item) => ({ item, hit, evidenceQuote: hit ? "q" : "" })),
            dimensions: [],
            ownershipWeak: false,
            note: "",
        },
    ],
    gradedBy: { profile: "interview", model: "m", usedFallback: false },
})

const build = async (stubs: Readonly<Record<string, unknown>> = {}) => {
    const tx = fakeTransaction(
        mockEntityManager({
            query: Object.entries({
                [SELECT_CALIBRATION_QUESTIONS]: [row],
                [SELECT_VALIDATED_BANKS]: [{ bank_id: BANK, version: "v1" }],
                [SUPERSEDE_BANK]: [],
                [PUBLISH_BANK]: [{ bank_id: BANK }],
                ...stubs,
            }),
        }),
    )
    const coach = mock<InterviewCoach>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            InterviewCalibrationService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: INTERVIEW_COACH, useValue: coach },
            { provide: INTERVIEW_RESOLVED_OPTIONS, useValue: builder<InterviewSettings>(DEFAULT_INTERVIEW_SETTINGS)() },
        ],
    }).compile()
    return { service: moduleRef.get(InterviewCalibrationService), tx, coach, logger }
}

const agreeing = (coach: ReturnType<typeof mock<InterviewCoach>>): void => {
    coach.grade.mockResolvedValueOnce(reading([true, true])).mockResolvedValueOnce(reading([true, false]))
}

describe("InterviewCalibrationService precheck", () => {
    it("scores the teacher's sample answers one by one without a learner and judges that the grader agrees", async () => {
        const { service, coach, logger } = await build()
        agreeing(coach)

        const result = await service.precheck(BANK, "v1")

        expect(result).toMatchObject({
            passed: true,
            agreement: 1,
            questions: [{ questionId: draft.questionId, ok: true }],
        })
        expect(coach.grade.mock.calls.map((call) => call[0].requestId)).toEqual([
            `calibration-${draft.questionId}-1`,
            `calibration-${draft.questionId}-2`,
        ])
        const asked = coach.grade.mock.calls[0]?.[0]
        expect(asked).toMatchObject({ locale: "vi", previousProblem: null })
        expect(asked?.questions[0]?.transcript.map((line) => [line.role, line.content])).toEqual([
            ["interviewer", LAYER_QUESTION_VI],
            ["candidate", "full answer"],
        ])
        expect(logger.info).toHaveBeenCalledWith(InterviewLogEvent.Calibrated, {
            bankId: BANK,
            version: "v1",
            passed: true,
            agreement: 1,
        })
    })

    it("disagrees when the grader scores a strong sample answer far below the teacher, or returns no reading", async () => {
        const low = await build()
        low.coach.grade.mockResolvedValue(reading([false, false]))
        const none = await build()
        none.coach.grade.mockResolvedValue({
            questions: [],
            gradedBy: { profile: "interview", model: "m", usedFallback: false },
        })

        await expect(low.service.precheck(BANK, "v1")).resolves.toMatchObject({ passed: false, agreement: 0 })
        await expect(none.service.precheck(BANK, "v1")).resolves.toMatchObject({ passed: false })
    })
})

describe("InterviewCalibrationService publish", () => {
    it("publishes after a passing pre-check, superseding the live version, and records the agreement", async () => {
        const { service, tx, coach } = await build()
        agreeing(coach)

        await expect(service.publish(BANK, "v1", false)).resolves.toEqual({
            bankId: BANK,
            version: "v1",
            mode: "precheck",
            agreement: 1,
        })

        expect(tx.em.query).toHaveBeenCalledWith(SUPERSEDE_BANK, [BANK])
        expect(storedJsonOf(firstParamsOf(tx.em, PUBLISH_BANK), 2)).toEqual({
            mode: "precheck",
            agreement: 1,
            at: NOW.toISOString(),
        })
    })

    it("keeps a bank unpublished when the grader drifted from the teacher, naming the questions", async () => {
        const { service, tx, coach } = await build()
        coach.grade.mockResolvedValue(reading([false, false]))

        await expect(service.publish(BANK, "v1", false)).rejects.toMatchObject({
            code: "INTERVIEW_CALIBRATION_FAILED",
            params: { bank: BANK, questions: draft.questionId },
        })
        expect(tx.em.query.mock.calls.some((call) => call[0] === PUBLISH_BANK)).toBe(false)
    })

    it("publishes without a pre-check when asked, and records that it was skipped", async () => {
        const { service, tx, coach } = await build()

        await expect(service.publish(BANK, "v1", true)).resolves.toEqual({
            bankId: BANK,
            version: "v1",
            mode: "skipped",
            agreement: null,
        })

        expect(coach.grade).not.toHaveBeenCalled()
        expect(storedJsonOf(firstParamsOf(tx.em, PUBLISH_BANK), 2)).toMatchObject({ mode: "skipped", agreement: null })
    })

    it("rolls back when the version is not there to publish", async () => {
        const { service, tx } = await build({ [PUBLISH_BANK]: [] })

        await expect(service.publish(BANK, "v1", true)).rejects.toMatchObject({ code: "INTERVIEW_IMPORT_REJECTED" })
        expect(tx.rollbacks).toBe(1)
    })

    it("publishes every validated bank, or the one named", async () => {
        const { service, tx } = await build()

        await expect(service.publishValidated("", true)).resolves.toEqual([
            { bankId: BANK, version: "v1", mode: "skipped", agreement: null },
        ])
        await service.publishValidated(BANK, true)

        expect(tx.em.query).toHaveBeenCalledWith(SELECT_VALIDATED_BANKS, ["", 500])
        expect(tx.em.query).toHaveBeenCalledWith(SELECT_VALIDATED_BANKS, [BANK, 500])
    })
})
