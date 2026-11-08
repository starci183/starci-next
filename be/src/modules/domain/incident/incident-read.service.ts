import { Injectable } from "@nestjs/common"
import { LessonReadService } from "@modules/domain/lesson"
import { InjectIncidentOptions } from "./incident.decorators"
import type { IncidentListFilter, IncidentListItemView } from "./incident.contracts"
import type { IncidentOptions } from "./incident.options"
import { DEFAULT_AUTHORED_INCIDENTS, incidentRank, incidentStatusOf } from "./incident-authored.policy"

@Injectable()
/** Serves the incident list: the live Essentials lessons, each with whether its tier-2 incident is written. */
export class IncidentReadService {
    constructor(
        private readonly lessons: LessonReadService,
        @InjectIncidentOptions() private readonly options: IncidentOptions,
    ) {}

    /** Lists the live lessons as incident rows, authored incidents first and the catalog order inside each group. */
    async list(filter: IncidentListFilter): Promise<ReadonlyArray<IncidentListItemView>> {
        const authored = this.options.authored ?? DEFAULT_AUTHORED_INCIDENTS
        const catalog = await this.lessons.catalog({
            locale: filter.locale,
            group: null,
            topic: filter.topic,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        const rows = catalog.map((lesson): IncidentListItemView => {
            const status = incidentStatusOf(lesson.id, authored)
            return {
                lessonId: lesson.id,
                title: lesson.title,
                topicId: lesson.topic.id,
                topicTitle: lesson.topic.title,
                group: lesson.group,
                difficulty: lesson.difficulty,
                minutes: lesson.minutes,
                incidentAvailable: status === "authored",
                status,
            }
        })
        return rows
            .map((row, position) => ({ row, position }))
            .sort((a, b) => incidentRank(a.row.status) - incidentRank(b.row.status) || a.position - b.position)
            .map(({ row }) => row)
    }
}
