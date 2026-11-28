"use client"

import { useTranslations } from "next-intl"
import { staticsUrl } from "@/modules/config"
import { MENTOR_AVATAR_KEY, type CourseNarrationWords } from "@/modules/course-lesson"

/**
 * The words of the narration every lesson page shares (lessons.md §9, owner 2026-11-28): the mentor's photo (a repo static) with his
 * label ("Thầy StarCi"), and the source of an interviewer's Quote, named after who asks ("CTO nivo.vn hỏi"; the same when the record
 * names no one, owner 2026-11-28: "ghi rõ CTO nivo.vn").
 */
export const useCourseNarrationWords = (): CourseNarrationWords => {
    const t = useTranslations("app.courseLesson.narration")
    return {
        narrator: { avatar: staticsUrl(MENTOR_AVATAR_KEY), label: t("narrator") },
        asker: (who) => t("asker", { who }),
        askerAnyone: t("askerAnyone"),
    }
}
