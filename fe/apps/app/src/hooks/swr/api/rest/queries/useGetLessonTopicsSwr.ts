"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonTopic } from "@/modules/api/graphql/queries/query-lesson-topic"
import { topicOf } from "@/modules/lesson-view"
import type { CatalogTopics } from "@/modules/types"

/** Cache identity of the catalog's topics read; the viewer, the topics and the locale are part of the key. */
export const QUERY_LESSON_TOPICS_SWR_KEY = "QUERY_LESSON_TOPICS_SWR"

/**
 * Reads the given topics, each with its whole path, in one locale, by topic id: the totals and the source the catalog's topic
 * cards show. A topic that cannot be read is left out, so its card falls back to the lessons the catalog already knows. The read
 * waits while there is no topic to ask about.
 */
export const useGetLessonTopicsSwr = (topicIds: ReadonlyArray<string>, locale: string): SWRResponse<CatalogTopics> => {
    const viewer = viewerKey(QUERY_LESSON_TOPICS_SWR_KEY, useViewerId())
    return useSWR<CatalogTopics>(
        viewer === null || topicIds.length === 0 ? null : [...viewer, locale, ...topicIds],
        async () => {
            const settled = await Promise.all(
                topicIds.map(async (topic) => {
                    try {
                        const { data } = await failing(() => queryLessonTopic({ request: { topic, locale } }))
                        return data === undefined ? undefined : topicOf(data)
                    } catch {
                        return undefined
                    }
                }),
            )
            return Object.fromEntries(settled.flatMap((topic) => (topic === undefined ? [] : [[topic.id, topic]])))
        },
    )
}
