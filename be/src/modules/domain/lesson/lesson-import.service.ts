import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import { contentHashOf, buildLessonDraft, lessonIdOf } from "./lesson-draft.policy"
import { InjectLessonSource, type LessonSourceReader } from "./lesson-source.port"
import { InjectLessonTopicCatalog } from "./lesson.decorators"
import { joinPaths } from "./lesson-topic.policy"
import type { LessonTopicCatalog, LessonTopicRecord } from "./lesson-topic.contracts"
import { LessonLogEvent } from "./lesson.log-events"
import {
    INSERT_VERSION,
    SELECT_VERSION_HASH,
    SUPERSEDE_PUBLISHED,
    UPDATE_SOURCE_KEY,
    UPSERT_TOPIC,
} from "./persistence/lesson.sql"
import type { HashRow, InsertedRow } from "./persistence/lesson.rows"
import { LESSON_LOCALES } from "./lesson.contracts"
import type { ImportLessonsParams, LessonDraft, LessonImportReport } from "./lesson-import.contracts"

/** The counts of one stored locale, which both locales share. */
interface Counts {
    readonly sections: number
    readonly activities: number
}

const countsOf = (draft: LessonDraft): Counts => {
    const { sections, retrieval } = draft.content.locales.vi
    return {
        sections: sections.length,
        activities:
            retrieval.length + sections.reduce((total, section) => total + (section.activities?.length ?? 0), 0),
    }
}

const byLocale = (draft: LessonDraft, pick: "title" | "description"): string =>
    JSON.stringify(Object.fromEntries(LESSON_LOCALES.map((locale) => [locale, draft.content.locales[locale][pick]])))

@Injectable()
/**
 * Imports concept folders as immutable lesson versions: the whole folder is read, parsed and validated before anything is
 * written; an identical version is left alone, other bytes under a stored version are refused, and a folder that fails never
 * touches the version that is live.
 */
export class LessonImportService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectLessonSource() private readonly source: LessonSourceReader,
        @InjectLessonTopicCatalog() private readonly catalog: LessonTopicCatalog,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Imports the concept folders of a directory under one version label and logs one report line per folder (counts,
     * version and hashes, never an answer). Every folder is tried; afterwards a refused or invalid folder fails the call.
     */
    async import(params: ImportLessonsParams): Promise<ReadonlyArray<LessonImportReport>> {
        if (params.directory.trim() === "" || params.ref.trim() === "") {
            throw new LessonError({ code: LessonErrorCode.ImportRejected })
        }
        const present = await this.source.folders(params.directory)
        const wanted = params.only.split(",").filter((name) => name !== "")
        const missing = wanted.filter((name) => !present.includes(name))
        if (missing.length > 0) {
            throw new LessonError({
                code: LessonErrorCode.ImportRejected,
                params: { folders: missing.join(", ") },
            })
        }
        const chosen = wanted.length === 0 ? present : present.filter((name) => wanted.includes(name))
        const reports: Array<LessonImportReport> = []
        await eachInOrder(chosen, async (folder) => {
            const report = await this.importFolder(params, folder)
            this.logger.info(LessonLogEvent.Imported, { ...report })
            reports.push(report)
        })
        const refused = reports.filter((report) => report.status === "refused")
        const invalid = reports.filter((report) => report.status === "invalid")
        if (refused.length + invalid.length === 0) return reports
        const folders = reports
            .filter((report) => refused.includes(report) || invalid.includes(report))
            .map((report) => report.folder)
            .join(", ")
        const code = refused.length > 0 ? LessonErrorCode.VersionImmutable : LessonErrorCode.ContentInvalid
        throw new LessonError({ code, params: { folders } })
    }

    private async importFolder(params: ImportLessonsParams, folder: string): Promise<LessonImportReport> {
        const files = await this.source.read(params.directory, folder)
        const { draft, issues } = buildLessonDraft(folder, files, this.catalog)
        const base = {
            folder,
            id: lessonIdOf(folder),
            version: params.ref,
            contentHash: contentHashOf(files),
            files: files.length,
        }
        if (draft === null) return { ...base, status: "invalid", sections: 0, activities: 0, issues }
        const counts = countsOf(draft)
        const stored: Array<HashRow> = await this.entityManager.query(SELECT_VERSION_HASH, [draft.id, params.ref])
        const held = stored[0]
        if (held?.content_hash === draft.contentHash) {
            if (held.source_key === draft.sourceKey) return { ...base, ...counts, status: "unchanged", issues: [] }
            await this.entityManager.query(UPDATE_SOURCE_KEY, [draft.id, params.ref, draft.sourceKey])
            return { ...base, ...counts, status: "relinked", issues: [] }
        }
        if (held !== undefined) {
            const message = `version ${params.ref} is stored with hash ${held.content_hash}, the source has ${draft.contentHash}`
            return { ...base, ...counts, status: "refused", issues: [{ path: folder, field: "", message }] }
        }
        const paths = await Promise.all(
            draft.topicSource.modules.map((module) => this.source.modules(params.directory, module)),
        )
        const record: LessonTopicRecord = {
            topic: draft.topic,
            title: draft.topicSource.title,
            from: draft.topicSource.from,
            details: draft.topicSource.details ?? null,
            path: joinPaths(paths),
        }
        await this.store(draft, record, params.ref)
        return { ...base, ...counts, status: "created", issues: [] }
    }

    private store(draft: LessonDraft, record: LessonTopicRecord, version: string): Promise<void> {
        return this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED, [draft.id])
            const inserted: Array<InsertedRow> = await manager.query(INSERT_VERSION, [
                draft.id,
                version,
                draft.contentHash,
                draft.category,
                draft.difficulty,
                draft.minutesRead,
                draft.implementation,
                draft.sortIndex,
                byLocale(draft, "title"),
                byLocale(draft, "description"),
                JSON.stringify(draft.sourceHashes),
                JSON.stringify(draft.content),
                this.clock.now(),
                draft.group,
                draft.topic,
                draft.sourceKey,
            ])
            if (inserted.length === 0) throw new LessonError({ code: LessonErrorCode.VersionImmutable })
            await manager.query(UPSERT_TOPIC, [
                record.topic,
                record.title,
                record.from,
                record.details?.description ?? null,
                JSON.stringify(record.details?.prerequisites ?? null),
                JSON.stringify(record.details?.related ?? null),
                JSON.stringify(record.path),
                version,
                this.clock.now(),
            ])
        })
    }
}
