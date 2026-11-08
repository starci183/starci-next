import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { PathError, PathErrorCode } from "./errors/path.error"
import { PATH_DEFINITIONS, definitionOf } from "./path-catalog.policy"
import { activeOf, viewOf } from "./path-view.policy"
import type { PathActiveResult, PathCatalogView, PathChosen, PathLocale } from "./path.contracts"
import type { ChoiceRow } from "./persistence/path.rows"
import { SELECT_CHOICE, UPSERT_CHOICE } from "./persistence/path.sql"

@Injectable()
/**
 * Outcome paths (the goal layer): the catalog of the five outcome paths, defined in code, and the one path each learner follows. The learner may
 * follow no path, and switching keeps every other record of the learner. This capability holds no streak and no experience.
 */
export class PathService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** The five paths in the asked locale with the id of the one the learner follows, or null. */
    async catalog(learnerId: string, locale: PathLocale): Promise<PathCatalogView> {
        const row = await this.choiceOf(learnerId)
        return {
            activePathId: row === null ? null : row.active_path_id,
            paths: PATH_DEFINITIONS.map((definition) => viewOf(definition, locale)),
        }
    }

    /** The path the learner follows with its next steps, or null when none is chosen. */
    async active(learnerId: string, locale: PathLocale): Promise<PathActiveResult> {
        const row = await this.choiceOf(learnerId)
        const definition = row === null ? null : definitionOf(row.active_path_id)
        return definition === null ? null : activeOf(definition, locale)
    }

    /** Sets the path the learner follows; an id outside the catalog is PATH_NOT_FOUND. The same path again keeps the first time. */
    async choose(learnerId: string, pathId: string): Promise<PathChosen> {
        const definition = definitionOf(pathId)
        if (definition === null) throw new PathError({ code: PathErrorCode.NotFound })
        const [row]: [ChoiceRow] = await this.entityManager.query(UPSERT_CHOICE, [
            learnerId,
            definition.id,
            this.clock.now(),
        ])
        return { activePathId: row.active_path_id, chosenAt: row.chosen_at }
    }

    private async choiceOf(learnerId: string): Promise<ChoiceRow | null> {
        const rows: Array<ChoiceRow> = await this.entityManager.query(SELECT_CHOICE, [learnerId])
        return rows[0] ?? null
    }
}
