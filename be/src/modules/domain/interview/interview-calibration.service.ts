import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import {
    authoredScoreOf,
    bankCalibrationOf,
    questionCalibrationOf,
    type BankCalibration,
    type QuestionCalibration,
    type SampleGrade,
} from "./calibration.policy"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import { InjectInterviewCoach, type InterviewCoach } from "./interview-coach.port"
import type { ExampleResult, GradingQuestion, InterviewLocale } from "./interview.contracts"
import { InterviewLogEvent } from "./interview.log-events"
import { firstLanguageOf, idealOf, promptOf } from "./question-lookup.policy"
import { scorecardOf } from "./scoring.policy"
import { InjectInterviewResolvedOptions } from "./interview.decorators"
import type { InterviewSettings } from "./interview.options"
import type { CalibrationRow } from "./persistence/interview.rows"
import {
    PUBLISH_BANK,
    SELECT_CALIBRATION_QUESTIONS,
    SELECT_VALIDATED_BANKS,
    SUPERSEDE_BANK,
} from "./persistence/interview.sql"

/** The locale the sample answers are graded in: the learners' own. */
const CALIBRATION_LOCALE: InterviewLocale = "vi"

/** How long the grader has for one sample answer. */
const SAMPLE_TIMEOUT_MS = 150_000

/** What publishing a bank version did. */
export interface PublishReport {
    /** The bank id. */
    readonly bankId: string
    /** The version. */
    readonly version: string
    /** How the bank was published: after the pre-check, or with it skipped on purpose. */
    readonly mode: "precheck" | "skipped"
    /** The share of questions that agreed with the teacher, or null when the pre-check was skipped. */
    readonly agreement: number | null
}

@Injectable()
/**
 * The calibration of the AI grader against the teacher: before a bank is published, the grader scores the five authored sample
 * answers of every technical question. It must keep their order (the strongest answer highest) and land near the teacher's reference
 * scores; a bank where too few questions agree stays unpublished.
 */
export class InterviewCalibrationService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        @InjectInterviewCoach() private readonly coach: InterviewCoach,
        @InjectInterviewResolvedOptions() private readonly settings: InterviewSettings,
    ) {}

    /** Scores the sample answers of every technical question of a bank version with the grader and judges whether it agrees. */
    async precheck(bankId: string, version: string): Promise<BankCalibration> {
        const rows: Array<CalibrationRow> = await this.entityManager.query(SELECT_CALIBRATION_QUESTIONS, [
            bankId,
            version,
            LIST_ROWS_MAX,
        ])
        const verdicts: Array<QuestionCalibration> = []
        await eachInOrder(rows, async (row) => {
            verdicts.push(await this.calibrate(row))
        })
        const result = bankCalibrationOf(verdicts)
        this.logger.info(InterviewLogEvent.Calibrated, {
            bankId,
            version,
            passed: result.passed,
            agreement: result.agreement,
        })
        return result
    }

    /**
     * Publishes a validated bank version and supersedes the live one. The pre-check runs first and a bank that fails it is
     * INTERVIEW_CALIBRATION_FAILED; `skipPrecheck` publishes without it and records that, for a dev stack with no AI key.
     */
    async publish(bankId: string, version: string, skipPrecheck: boolean): Promise<PublishReport> {
        const result = skipPrecheck ? null : await this.precheck(bankId, version)
        if (result !== null && !result.passed) {
            throw new InterviewError({
                code: InterviewErrorCode.CalibrationFailed,
                params: {
                    bank: bankId,
                    questions: result.questions
                        .filter((entry) => !entry.ok)
                        .map((entry) => entry.questionId)
                        .join(", "),
                },
            })
        }
        const mode = result === null ? "skipped" : "precheck"
        const agreement = result?.agreement ?? null
        const calibration = { mode, agreement, at: this.clock.now().toISOString() }
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_BANK, [bankId])
            const published: Array<unknown> = await manager.query(PUBLISH_BANK, [
                bankId,
                version,
                JSON.stringify(calibration),
                this.clock.now(),
            ])
            if (published.length === 0) throw new InterviewError({ code: InterviewErrorCode.ImportRejected })
        })
        this.logger.info(InterviewLogEvent.Published, { bankId, version, mode })
        return { bankId, version, mode, agreement }
    }

    /** Publishes every validated bank (or the one named), each after its own pre-check. */
    async publishValidated(only: string, skipPrecheck: boolean): Promise<ReadonlyArray<PublishReport>> {
        const banks: Array<{ bank_id: string; version: string }> = await this.entityManager.query(
            SELECT_VALIDATED_BANKS,
            [only, LIST_ROWS_MAX],
        )
        const reports: Array<PublishReport> = []
        await eachInOrder(banks, async (bank) => {
            reports.push(await this.publish(bank.bank_id, bank.version, skipPrecheck))
        })
        return reports
    }

    private async calibrate(row: CalibrationRow): Promise<QuestionCalibration> {
        const language = firstLanguageOf(row.bodies)
        const material = row.grading.locales[CALIBRATION_LOCALE]
        const prompt = promptOf(row.bodies, language, CALIBRATION_LOCALE).prompt
        const idealAnswer = idealOf(row.grading, language, CALIBRATION_LOCALE)
        const grades: Array<SampleGrade> = []
        await eachInOrder(material.exampleResults, async (example) => {
            const question: GradingQuestion = {
                position: 0,
                questionId: row.question_id,
                family: "technical",
                kind: row.kind,
                prompt,
                material,
                idealAnswer,
                transcript: [
                    { role: "interviewer", kind: "prompt", content: prompt },
                    { role: "candidate", kind: "answer", content: example.answer },
                ],
            }
            grades.push(await this.sample(row.question_id, example, question))
        })
        return questionCalibrationOf(row.question_id, grades)
    }

    private async sample(questionId: string, example: ExampleResult, question: GradingQuestion): Promise<SampleGrade> {
        const reply = await this.coach.grade({
            requestId: `calibration-${questionId}-${example.level}`,
            locale: CALIBRATION_LOCALE,
            questions: [question],
            previousProblem: null,
            timeoutMs: SAMPLE_TIMEOUT_MS,
        })
        const card = scorecardOf(
            [
                {
                    position: 0,
                    questionId,
                    family: "technical",
                    material: question.material,
                    idealAnswer: question.idealAnswer,
                    moduleRefs: [],
                    skipped: false,
                    hintsUsed: 0,
                    graded: reply.questions[0] ?? null,
                },
            ],
            this.settings.scoring,
        )
        return { level: example.level, authored: authoredScoreOf(example), graded: card.overallScore }
    }
}
