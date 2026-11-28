"use client"

import { useTranslations } from "next-intl"
import { staticsUrl } from "@/modules/config"
import { MENTOR_AVATAR_KEY, type CourseNarrationWords } from "@/modules/course-lesson"

/**
 * The words of the narration every lesson page shares (lessons.md §9, owner 2026-11-28): the mentor's photo (a repo static) with his
 * label ("Thầy StarCi"), and the source of his questions' Quote: who the record says asks, else the mentor himself, "Thầy StarCi · CTO
 * nivo.vn" (owner 2026-11-28: "là thầy hỏi đó").
 */
export const useCourseNarrationWords = (): CourseNarrationWords => {
    const t = useTranslations("app.courseLesson.narration")
    return {
        narrator: { avatar: staticsUrl(MENTOR_AVATAR_KEY), label: t("narrator"), title: t("narratorTitle") },
        asker: (who) => t("asker", { who }),
        askerAnyone: t("askerAnyone"),
    }
}
