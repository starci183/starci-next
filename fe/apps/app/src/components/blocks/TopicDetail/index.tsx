"use client"

import { useLocale, useTranslations } from "next-intl"
import { loadingSlot, mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useGetEssentialsSwr,
    useGetLessonProgressSwr,
    useGetLessonTopicSwr,
    useQueryLessonOpenerScoresSwr,
} from "@/hooks/swr"
import { topicScreenOf, useLegacyLessonDestination, useTopicLabels, useTopicWords } from "@/hooks/topic"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES } from "@/modules/routes"
import { TOPIC_PLACEHOLDER, TopicDetailBase } from "./component"

/** What the route hands the topic block: the segment of the address. */
type TopicDetailProps = { readonly topicId: string }

/**
 * The connected topic screen: reads the topic, the catalog (which titles the lessons and the related topics) and the
 * five-question opener score of each lesson, and words every row; the lessons stand in the teacher's order.
 */
export const TopicDetail = (props: TopicDetailProps) => {
    const t = useTranslations("app.essentials.topic")
    const locale = useLocale()
    const read = useGetLessonTopicSwr(props.topicId, locale)
    const catalog = useGetEssentialsSwr(locale)
    const words = useTopicWords()
    const progress =
        useGetLessonProgressSwr((read.data?.path ?? []).flatMap((row) => (row.lessonId === "" ? [] : [row.lessonId])))
            .data ?? {}
    const lessonIds = (read.data?.path ?? []).flatMap((row) => (row.lessonId === "" ? [] : [row.lessonId]))
    const openers = useQueryLessonOpenerScoresSwr(lessonIds).data ?? {}
    const movedTo = useLegacyLessonDestination(props.topicId, read.error)
    useDocumentTitle(read.data === undefined ? undefined : `${read.data.title} · ${t("pageTitle")}`)
    return (
        <TopicDetailBase
            props={{
                slot:
                    movedTo === ""
                        ? mapSlot(slotOfSwr(read), (topic) =>
                              topicScreenOf({ topic, catalog: catalog.data ?? [], progress, words, openers }),
                          )
                        : loadingSlot(),
                placeholder: TOPIC_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: useTopicLabels(),
                progressTitle: t("progressTitle"),
                plansHref: APP_ROUTES.premium,
                catalogHref: APP_ROUTES.essentials,
                movedTo,
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
