import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { buildBankDraft } from "./bank-draft.policy"
import { InterviewError, InterviewErrorCode } from "./errors/interview.error"
import type {
    BankDraft,
    ImportInterviewParams,
    InterviewImportReport,
    InterviewSourceBank,
    QuestionDraft,
} from "./interview.contracts"
import { InterviewLogEvent } from "./interview.log-events"
import { InjectInterviewSource, type InterviewSourceReader } from "./interview-source.port"
import type { BankHashRow } from "./persistence/interview.rows"
import { INSERT_BANK, INSERT_QUESTION, SELECT_BANK_HASH } from "./persistence/interview.sql"

/** The error that names the banks a run refused or found invalid, or null when every bank was imported or unchanged. */
const failureOf = (reports: ReadonlyArray<InterviewImportReport>): InterviewError | null => {
    const failed = reports.filter((report) => report.status === "refused" || report.status === "invalid")
    if (failed.length === 0) return null
    const code = failed.some((report) => report.status === "refused")
        ? InterviewErrorCode.BankImmutable
        : InterviewErrorCode.BankInvalid
    return new InterviewError({ code, params: { banks: failed.map((report) => report.bankId).join(", ") } })
}

@Injectable()
/**
 * Imports the teacher's interview banks as immutable versions: the whole bank is read, parsed and validated before anything is
 * written; an identical version is left alone, other bytes under a stored version are refused, and a bank that fails never touches
 * the version that is live. A new version is stored as validated: it goes live only when it is published after its calibration.
 */
export class InterviewImportService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectInterviewSource() private readonly source: InterviewSourceReader,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Imports the banks of a data checkout under one version label and logs one report line per bank (counts, version and
     * hashes, never an answer). Every bank is tried; afterwards a refused or invalid bank fails the call.
     */
    async import(params: ImportInterviewParams): Promise<ReadonlyArray<InterviewImportReport>> {
        if (params.directory.trim() === "" || params.ref.trim() === "") {
            throw new InterviewError({ code: InterviewErrorCode.ImportRejected })
        }
        const present =
            params.overlay === undefined
                ? await this.source.banks(params.directory)
                : await this.source.banks(params.directory, params.overlay)
        const wanted = params.only.split(",").filter((id) => id !== "")
        const missing = wanted.filter((id) => !present.some((bank) => bank.bankId === id))
        if (missing.length > 0) {
            throw new InterviewError({ code: InterviewErrorCode.ImportRejected, params: { banks: missing.join(", ") } })
        }
        const chosen = wanted.length === 0 ? present : present.filter((bank) => wanted.includes(bank.bankId))
        const reports = await this.importEach(params, chosen)
        const failure = failureOf(reports)
        if (failure !== null) throw failure
        return reports
    }

    private async importEach(
        params: ImportInterviewParams,
        banks: ReadonlyArray<InterviewSourceBank>,
    ): Promise<ReadonlyArray<InterviewImportReport>> {
        const reports: Array<InterviewImportReport> = []
        await eachInOrder(banks, async (bank) => {
            const report = await this.importBank(params, bank)
            this.logger.info(InterviewLogEvent.Imported, { ...report })
            reports.push(report)
        })
        return reports
    }

    private async importBank(params: ImportInterviewParams, bank: InterviewSourceBank): Promise<InterviewImportReport> {
        const files =
            params.overlay === undefined
                ? await this.source.read(params.directory, bank)
                : await this.source.read(params.directory, bank, params.overlay)
        const { draft, issues } = buildBankDraft(bank, files)
        const base = { bankId: bank.bankId, version: params.ref, files: files.length }
        if (draft === null) return { ...base, status: "invalid", contentHash: "", questions: 0, skipped: 0, issues }
        const counts = { contentHash: draft.contentHash, questions: draft.questions.length, skipped: draft.skipped }
        const stored: Array<BankHashRow> = await this.entityManager.query(SELECT_BANK_HASH, [bank.bankId, params.ref])
        const held = stored[0]
        if (held === undefined) {
            await this.store(draft, params.ref)
            return { ...base, ...counts, status: "created", issues: [] }
        }
        if (held.content_hash === draft.contentHash) return { ...base, ...counts, status: "unchanged", issues: [] }
        const message = `version ${params.ref} is stored with hash ${held.content_hash}, the source has ${draft.contentHash}`
        return { ...base, ...counts, status: "refused", issues: [{ path: bank.bankId, field: "", message }] }
    }

    private store(draft: BankDraft, version: string): Promise<void> {
        return this.entityManager.transaction(async (manager) => {
            const inserted: Array<unknown> = await manager.query(INSERT_BANK, [
                draft.bankId,
                version,
                draft.contentHash,
                draft.family,
                draft.course,
                draft.sortIndex,
                draft.difficulty,
                JSON.stringify(draft.titles),
                JSON.stringify(draft.descriptions),
                draft.moduleRefs,
                draft.questions.length,
                this.clock.now(),
            ])
            if (inserted.length === 0) throw new InterviewError({ code: InterviewErrorCode.BankImmutable })
            await eachInOrder(draft.questions, async (question) => {
                await manager.query(INSERT_QUESTION, [...this.questionParams(draft.bankId, version, question)])
            })
        })
    }

    private questionParams(bankId: string, version: string, question: QuestionDraft): ReadonlyArray<unknown> {
        return [
            bankId,
            version,
            question.questionId,
            question.sortIndex,
            question.isPremium,
            question.family,
            question.tier,
            question.kind,
            question.tags,
            question.competency,
            question.leadershipTier,
            JSON.stringify(question.bodies),
            JSON.stringify(question.interviewer),
            JSON.stringify(question.grading),
        ]
    }
}
