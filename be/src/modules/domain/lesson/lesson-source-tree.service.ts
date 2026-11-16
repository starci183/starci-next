import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_PUBLISHED } from "./persistence/lesson.sql"
import type { LessonSourceTree } from "./lesson-source-tree.contracts"
import { lessonSourceTreeOf } from "./lesson-source-tree.policy"

@Injectable()
/**
 * The shared read of the source tree of a lesson at its pinned content commit: the files of the `source/` folder of the live
 * version, with its public scenarios and invariants. It is the one place a reader of the source (the MCP) gets code from; the
 * `hidden/` folder, the challenges and the hidden scenarios are never part of what it returns.
 */
export class LessonSourceTreeService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The source tree of the live version of a lesson, or null when the lesson is not live or ships no `source/`. */
    async tree(lessonId: string): Promise<LessonSourceTree | null> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        return row === undefined ? null : lessonSourceTreeOf(row.version, row.content)
    }
}
