"use client"

import { useLocale, useTranslations } from "next-intl"
import type { CourseCatalogCourseView, CourseCatalogLabels, DataSlot, SlotLabels } from "@starci-next/ui"
import { useSession } from "@/hooks/auth"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryCoursesSwr, type CoursesRead } from "@/hooks/swr"
import { localized } from "@/modules/course-lesson"
import { APP_ROUTES, courseLessonPath, signInRedirectHref } from "@/modules/routes"

/** The Essentials v2 catalog as the screen draws it. */
export type CourseCatalogScreen = {
    readonly props: {
        readonly slot: DataSlot<ReadonlyArray<CourseCatalogCourseView>>
        readonly slotLabels: SlotLabels
        readonly labels: CourseCatalogLabels
        readonly pageHeading: string
        readonly pageSub: string
        readonly errorText: string
        readonly forbidden: string
        readonly upgrade: string
        readonly signIn: string
        readonly isGuest: boolean
        readonly plansHref: string
        readonly signInHref: string
    }
    readonly on: { readonly retry: () => void }
}

/** The courses of the catalog as rows: each lesson links to its six pages once it has a lab. */
const coursesOf = (read: CoursesRead, locale: string): ReadonlyArray<CourseCatalogCourseView> =>
    read.map((course) => ({
        id: course.courseId,
        title: localized(course.title, locale),
        summary: localized(course.summary, locale),
        lessons: course.lessons.map((lesson) => ({
            id: lesson.lessonId,
            title: localized(lesson.title, locale),
            concept: lesson.conceptTerm,
            href: lesson.available ? courseLessonPath(course.courseId, lesson.lessonId, "intro") : undefined,
        })),
    }))

/** Reads the course catalog and resolves its words once. */
export const useCourseCatalogScreen = (): CourseCatalogScreen => {
    const t = useTranslations("app.courseCatalog")
    const locale = useLocale()
    const session = useSession()
    const read = useQueryCoursesSwr(session.status === "signed-in")
    const isGuest = session.status === "signed-out"
    const slotLabelsOf = useSlotLabels()
    const slot = isGuest
        ? { isForbidden: true as const }
        : mapSlot(
              slotOfSwr({
                  data: read.data,
                  error: read.error,
                  isLoading: read.isLoading || session.status === "unknown",
                  isValidating: read.isValidating,
              }),
              (courses) => coursesOf(courses, locale),
          )
    return {
        props: {
            slot,
            slotLabels: slotLabelsOf(t("empty")),
            labels: { lessonsEmpty: t("lessonsEmpty"), soon: t("soon") },
            pageHeading: t("pageHeading"),
            pageSub: t("pageSub"),
            errorText: t("error"),
            forbidden: isGuest ? t("forbiddenGuest") : t("forbiddenPremium"),
            upgrade: t("upgrade"),
            signIn: t("signIn"),
            isGuest,
            plansHref: APP_ROUTES.premium,
            signInHref: signInRedirectHref(APP_ROUTES.signIn, APP_ROUTES.essentialsV2),
        },
        on: { retry: () => void read.mutate() },
    }
}
