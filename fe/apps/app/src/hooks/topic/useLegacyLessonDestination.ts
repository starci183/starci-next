"use client"

import { useLocale } from "next-intl"
import { useGetLessonSwr } from "@/hooks/swr"
import { isTopicNotFound } from "@/modules/failure"
import { lessonPath } from "@/modules/routes"

/**
 * An old link `/essentials/{lesson}` reaches the topic route with a lesson id. Once the topic read says the segment is no topic,
 * the lesson is read and the destination under its topic is answered; empty while nothing moved. The screen offers that link:
 * a server 308 would need the page to read data, which a page owner never does.
 */
export const useLegacyLessonDestination = (segment: string, topicError: unknown): string => {
    const { data } = useGetLessonSwr(segment, useLocale(), isTopicNotFound(topicError))
    return data === undefined ? "" : lessonPath(data.topic.id, data.id)
}
