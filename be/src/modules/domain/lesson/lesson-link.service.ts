import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { LessonLocale } from "./lesson.contracts"
import type { ModuleLessonRow } from "./persistence/lesson.rows"
import { SELECT_MODULE_LESSONS } from "./persistence/lesson.sql"

/** A live lesson a module slug leads to. */
export interface LessonModuleLink {
    /** The lesson id. */
    readonly lessonId: string
    /** The topic the lesson sits under. */
    readonly topic: string
    /** The title in the asked locale. */
    readonly title: string
}

/** The live lessons of each module slug. */
export interface LessonModuleLinks {
    readonly [moduleRef: string]: ReadonlyArray<LessonModuleLink>
}

@Injectable()
/** Finds the live lessons that came from the V1 course modules other parts name, so they can link back to Essentials. */
export class LessonLinkService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The live lessons of each module slug, titled in one locale; a slug with no live lesson is absent from the answer. */
    async ofModules(moduleRefs: ReadonlyArray<string>, locale: LessonLocale): Promise<LessonModuleLinks> {
        if (moduleRefs.length === 0) return {}
        const rows: Array<ModuleLessonRow> = await this.entityManager.query(SELECT_MODULE_LESSONS, [
            [...moduleRefs],
            locale,
            LIST_ROWS_MAX,
        ])
        return rows.reduce<Record<string, Array<LessonModuleLink>>>(
            (links, row) => ({
                ...links,
                [row.module_ref]: [
                    ...(links[row.module_ref] ?? []),
                    { lessonId: row.lesson_id, topic: row.topic, title: row.title },
                ],
            }),
            {},
        )
    }
}
