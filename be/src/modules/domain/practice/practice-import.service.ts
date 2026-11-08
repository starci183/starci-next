import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { buildPracticeDraft } from "./practice-draft.policy"
import { InjectPracticeSource, type PracticeSourceReader } from "./practice-source.port"
import { PracticeLogEvent } from "./practice.log-events"
import type {
    ImportPracticeParams,
    PracticeDraft,
    PracticeImportReport,
    PracticeSourceEntry,
} from "./practice.contracts"
import type { VersionHashRow } from "./persistence/practice.rows"
import { INSERT_VERSION, SELECT_VERSION_HASH, SUPERSEDE_PUBLISHED } from "./persistence/practice.sql"

@Injectable()
/**
 * Imports the teacher's problem folders as immutable versions: each folder is read, parsed and validated before anything is
 * written; an identical version is left alone, other bytes under a stored version are refused, and a folder that fails never
 * touches the version that is live.
 */
export class PracticeImportService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectPracticeSource() private readonly source: PracticeSourceReader,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Imports the problem folders of a directory under one version label and logs one report line per folder (counts and
     * status, never a test or a solution). Every folder is tried; afterwards a refused or invalid folder fails the call.
     */
    async import(params: ImportPracticeParams): Promise<ReadonlyArray<PracticeImportReport>> {
        if (params.directory.trim() === "" || params.ref.trim() === "")
            throw new PracticeError({ code: PracticeErrorCode.ImportRejected })
        const chosen = await this.choose(params)
        const reports: Array<PracticeImportReport> = []
        await eachInOrder(chosen, async (entry) => {
            const report = await this.importEntry(params, entry)
            this.logger.info(PracticeLogEvent.Imported, { ...report, issues: report.issues.length })
            reports.push(report)
        })
        const failed = reports.filter((report) => report.status === "refused" || report.status === "invalid")
        if (failed.length > 0) throw this.failureOf(failed)
        return reports
    }

    /** The error for a run in which some folders were refused or invalid: the immutable version wins over invalid content. */
    private failureOf(failed: ReadonlyArray<PracticeImportReport>): PracticeError {
        const refused = failed.some((report) => report.status === "refused")
        const folders = failed.map((report) => report.folder).join(", ")
        const code = refused ? PracticeErrorCode.VersionImmutable : PracticeErrorCode.ContentInvalid
        return new PracticeError({ code, params: { folders } })
    }

    private async importEntry(params: ImportPracticeParams, entry: PracticeSourceEntry): Promise<PracticeImportReport> {
        const files = await this.source.read(params.directory, entry)
        const { draft, issues } = buildPracticeDraft(entry, files)
        const folder = `${entry.pattern}/${entry.slug}`
        const base = { folder, pattern: entry.pattern, version: params.ref }
        if (draft === null) return { ...base, status: "invalid", tests: 0, issues }
        const stored: Array<VersionHashRow> = await this.entityManager.query(SELECT_VERSION_HASH, [
            draft.id,
            params.ref,
        ])
        const held = stored[0]
        const tests = draft.tests.length
        if (held?.content_hash === draft.contentHash) return { ...base, status: "unchanged", tests, issues: [] }
        if (held !== undefined) return { ...base, status: "refused", tests, issues: [] }
        await this.store(draft, params.ref)
        return { ...base, status: "created", tests, issues: [] }
    }

    /** The folders to import: all of them, or the patterns `only` names (an unknown pattern refuses the call). */
    private async choose(params: ImportPracticeParams): Promise<ReadonlyArray<PracticeSourceEntry>> {
        const present = await this.source.entries(params.directory)
        const wanted = params.only.split(",").filter((name) => name !== "")
        const missing = wanted.filter((name) => !present.some((entry) => entry.pattern === name))
        if (missing.length > 0)
            throw new PracticeError({
                code: PracticeErrorCode.ImportRejected,
                params: { patterns: missing.join(", ") },
            })
        const chosen = wanted.length === 0 ? present : present.filter((entry) => wanted.includes(entry.pattern))
        return chosen
    }

    private store(draft: PracticeDraft, version: string): Promise<void> {
        return this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED, [draft.id])
            const inserted: Array<{ problem_id: string }> = await manager.query(INSERT_VERSION, [
                draft.id,
                version,
                draft.contentHash,
                draft.patternId,
                draft.orderIndex,
                draft.difficulty,
                JSON.stringify(draft.tags),
                draft.timeLimitMs,
                draft.memoryLimitKb,
                JSON.stringify({ vi: draft.content.vi.title, en: draft.content.en.title }),
                JSON.stringify(draft.content),
                JSON.stringify(draft.starterCodes),
                JSON.stringify(draft.examples),
                JSON.stringify(draft.tests),
                JSON.stringify(draft.solutions),
                JSON.stringify(draft.sourceHashes),
                this.clock.now(),
            ])
            if (inserted.length === 0) throw new PracticeError({ code: PracticeErrorCode.VersionImmutable })
        })
    }
}
