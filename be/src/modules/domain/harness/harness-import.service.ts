import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { sourceArchiveOf } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"
import type { HarnessImportReport, ImportHarnessParams } from "./harness.contracts"
import { HarnessLogEvent } from "./harness.log-events"
import { convertRawHarness } from "./harness-raw.policy"
import { InjectHarnessSource, type HarnessSourceReader } from "./harness-source.port"
import { storeItemsOf, type HarnessStoreItem } from "./harness-store.policy"
import type { ContentRow, HashRow } from "./persistence/harness.rows"
import {
    INSERT_CONTENT,
    SELECT_PUBLISHED_ONE,
    SELECT_VERSION_HASH,
    SUPERSEDE_PUBLISHED,
} from "./persistence/harness.sql"

@Injectable()
/**
 * Imports the `raw/harness` tree of a content checkout as immutable versions: the whole tree is converted and validated before
 * anything is written; an item whose live version has the same hash is left alone, other bytes under a stored version are refused,
 * and a tree with findings never touches what is live. It is the importer of the current content path (`cli content sync`) and
 * the seed adapter calls the same converter.
 */
export class HarnessImportService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectHarnessSource() private readonly source: HarnessSourceReader,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /** Whether the checkout holds a raw harness tree. */
    has(directory: string): Promise<boolean> {
        return this.source.exists(directory)
    }

    /** Imports the tree under one version label and logs one line per item (kind, key, status); any finding or conflict fails the call. */
    async import(params: ImportHarnessParams): Promise<ReadonlyArray<HarnessImportReport>> {
        if (params.directory === "" || params.ref === "" || !(await this.source.exists(params.directory))) {
            throw new HarnessError({ code: HarnessErrorCode.ImportRejected })
        }
        const converted = convertRawHarness(await this.source.read(params.directory))
        if (converted.issues.length > 0) {
            converted.issues.forEach((issue) =>
                this.logger.warn(HarnessLogEvent.Imported, { path: issue.path, code: issue.code, status: "invalid" }),
            )
            throw new HarnessError({ code: HarnessErrorCode.ContentInvalid })
        }
        const reports: Array<HarnessImportReport> = []
        await eachInOrder(storeItemsOf(converted), async (item) => {
            const status = await this.store(item, params.ref)
            this.logger.info(HarnessLogEvent.Imported, { kind: item.kind, key: item.key, version: params.ref, status })
            reports.push({ kind: item.kind, key: item.key, status })
        })
        if (reports.some((report) => report.status === "refused")) {
            throw new HarnessError({ code: HarnessErrorCode.VersionConflict })
        }
        return reports
    }

    private async store(item: HarnessStoreItem, version: string): Promise<HarnessImportReport["status"]> {
        const live: Array<ContentRow> = await this.entityManager.query(SELECT_PUBLISHED_ONE, [item.kind, item.key])
        if (live[0]?.content_hash === item.hash) return "unchanged"
        const sameVersion: Array<HashRow> = await this.entityManager.query(SELECT_VERSION_HASH, [
            item.kind,
            item.key,
            version,
        ])
        if (sameVersion.length > 0) return sameVersion[0]?.content_hash === item.hash ? "unchanged" : "refused"
        const archive =
            item.packFiles === null
                ? null
                : sourceArchiveOf(item.packFiles.map((file) => ({ path: file.path, content: file.text })))
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED, [item.kind, item.key])
            await manager.query(INSERT_CONTENT, [
                item.kind,
                item.key,
                version,
                item.hash,
                item.order,
                JSON.stringify(item.content),
                archive?.content ?? null,
                archive?.sha256 ?? null,
                this.clock.now(),
            ])
        })
        return "created"
    }
}
