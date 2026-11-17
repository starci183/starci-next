import { createHash } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { isRecord } from "@modules/platform/primitives"
import { CHECK_DOCUMENT_SETS } from "./project-check-document.set"
import type { CheckSetFiles } from "./project-check-set.contracts"
import { ProjectCheckSetDiskAdapter } from "./project-check-set-disk.adapter"
import type { ProjectCheckSource } from "./project-check-set.port"
import { SELECT_CHECK_DOCUMENTS } from "./persistence/project.sql"

/** What the read of the catalog and probe documents answers. */
interface DocumentRow {
    document_set: string
    document_key: string
    body: Record<string, unknown>
}

const textOf = (body: Record<string, unknown>): string => {
    const text = body["text"]
    return typeof text === "string" ? text : ""
}

@Injectable()
/**
 * Reads the check set from the database, where the seed door of the app put the catalog and the shared probes of the seed standard.
 * With no catalog stored it falls back to the directory `PROJECT_CHECKS_DIR` names, the checkout a developer authors against.
 */
export class ProjectCheckSetStoreAdapter implements ProjectCheckSource {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly disk: ProjectCheckSetDiskAdapter,
    ) {}

    /** Reads the catalog text and every probe text, versioned by their digest, or the checkout files when none is stored. */
    async read(): Promise<CheckSetFiles | null> {
        const rows: Array<DocumentRow> = await this.entityManager.query(SELECT_CHECK_DOCUMENTS, [
            [CHECK_DOCUMENT_SETS.catalog, CHECK_DOCUMENT_SETS.probes],
        ])
        const catalog = rows.find((row) => row.document_set === CHECK_DOCUMENT_SETS.catalog && isRecord(row.body))
        if (catalog === undefined) return this.disk.read()
        const probes = Object.fromEntries(
            rows
                .filter((row) => row.document_set === CHECK_DOCUMENT_SETS.probes)
                .map((row) => [`${row.document_key}.yaml`, textOf(row.body)]),
        )
        const text = textOf(catalog.body)
        const version = createHash("sha256").update(text).update(JSON.stringify(probes)).digest("hex").slice(0, 12)
        return { version, catalog: text, probes }
    }
}
