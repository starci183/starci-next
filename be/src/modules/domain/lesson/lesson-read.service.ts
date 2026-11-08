import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import type { CatalogRow, RelatedTopicRow, TopicLessonRow, TopicRow, VersionRow } from "./persistence/lesson.rows"
import {
    SELECT_CATALOG,
    SELECT_PUBLISHED,
    SELECT_RELATED_TOPICS,
    SELECT_TOPIC,
    SELECT_TOPIC_LESSONS,
} from "./persistence/lesson.sql"
import type {
    LessonCatalogFilter,
    LessonCatalogItemView,
    LessonLookupParams,
    LessonView,
} from "./lesson-read.contracts"
import { toTopicView } from "./lesson-topic.mapper"
import type { LessonTopicParams, LessonTopicView } from "./lesson-topic-view.contracts"
import { toCatalogItem, toLessonView } from "./lesson-view.mapper"

@Injectable()
/** Serves the learner-facing reads of the live lessons: the catalog and one lesson's public projection. */
export class LessonReadService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
    ) {}

    /** Lists the live lessons in catalog order, titled in the asked locale and narrowed by the filters the caller gave. */
    async catalog(filter: LessonCatalogFilter): Promise<ReadonlyArray<LessonCatalogItemView>> {
        const rows: Array<CatalogRow> = await this.entityManager.query(SELECT_CATALOG, [
            LIST_ROWS_MAX,
            filter.locale,
            filter.category,
            filter.difficulty,
            filter.language,
            filter.provider,
            filter.q,
            filter.group,
            filter.topic,
        ])
        return rows.map((row) => toCatalogItem(row))
    }

    /**
     * The public projection of the live version of a lesson: the overview and the free phase for any learner, the locked
     * placeholders for the rest unless the learner holds Premium. A lesson that is not live is not found.
     */
    async find(params: LessonLookupParams): Promise<LessonView> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [params.id])
        const row = rows[0]
        if (row === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        return toLessonView(row, params.locale, await this.entitlement.isPremium(params.learnerId))
    }

    /**
     * The topic page: the topic, its group and its path of lessons in the teacher's order, with the published lessons linked.
     * A topic is listed only once one of its lessons is published; before that, and for an unknown slug, it is not found.
     */
    async topic(params: LessonTopicParams): Promise<LessonTopicView> {
        const topics: Array<TopicRow> = await this.entityManager.query(SELECT_TOPIC, [params.topic])
        const lessons: Array<TopicLessonRow> = await this.entityManager.query(SELECT_TOPIC_LESSONS, [
            params.topic,
            params.locale,
            LIST_ROWS_MAX,
        ])
        const row = topics[0]
        const first = lessons[0]
        if (row === undefined || first === undefined) throw new LessonError({ code: LessonErrorCode.TopicNotFound })
        const related: Array<RelatedTopicRow> =
            row.related === null || row.related.length === 0
                ? []
                : await this.entityManager.query(SELECT_RELATED_TOPICS, [row.related, LIST_ROWS_MAX])
        return toTopicView(row, lessons, first.lesson_group, params.locale, related)
    }
}
