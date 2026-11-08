"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonTopic } from "@/modules/api/graphql/queries/query-lesson-topic"
import { topicOf } from "@/modules/lesson-view"
import type { TopicView } from "@/modules/types"

/** Cache identity of the topic read; the viewer, the topic and the locale are part of the key. */
export const QUERY_LESSON_TOPIC_SWR_KEY = "QUERY_LESSON_TOPIC_SWR"

/** Reads one topic and its path in one locale through the topic query, wrapped in SWR. */
export const useGetLessonTopicSwr = (topicId: string, locale: string): SWRResponse<TopicView> => {
    const viewer = viewerKey(QUERY_LESSON_TOPIC_SWR_KEY, useViewerId())
    return useSWR<TopicView>(viewer === null ? null : [...viewer, topicId, locale], async () => {
        const { data } = await failing(() => queryLessonTopic({ request: { topic: topicId, locale } }))
        if (data === undefined) throw new Error("topic answered no data")
        return topicOf(data)
    })
}
