"use client"

import { useTranslations } from "next-intl"
import { staticsUrl } from "@/modules/config"
import { MENTOR_AVATAR_KEY, type CourseNarrationWords } from "@/modules/course-lesson"

/**
 * The words of the narration every lesson page shares (lessons.md §9, owner 2026-11-28): the mentor's photo (a repo static) with his
 * label ("Thầy StarCi"), and the label over an interviewer's question, named after who asks ("Anh trưởng nhóm hỏi") or generic.
 */
export const useCourseNarrationWords = (): CourseNarrationWords => {
    const t = useTranslations("app.courseLesson.narration")
    return {
        narrator: { avatar: staticsUrl(MENTOR_AVATAR_KEY), label: t("narrator") },
        asker: (who) => t("asker", { who }),
        askerAnyone: t("askerAnyone"),
    }
}
