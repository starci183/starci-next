"use client"

import { useLocale } from "next-intl"
import { navigation } from "@starci-next/i18n/navigation"
import { useSession } from "@/hooks/auth"
import { slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useDocumentTitle } from "@/hooks/title"
import { COURSE_PAGES, casesOf, greenCountOf, loopOf, pageOf, selectedCaseOf } from "@/modules/course-lesson"
import { APP_ROUTES, courseLessonPath, signInRedirectHref } from "@/modules/routes"
import { PLACEHOLDER_VIEW, viewOf, type CourseLessonRoute, type CourseLessonScreen } from "./courseLesson.shared"
import { useCourseHints } from "./useCourseHints"
import { useCourseLessonReads } from "./useCourseLessonReads"
import { useCourseLoopLabels } from "./useCourseLoopLabels"
import { useCoursePageLabels } from "./useCoursePageLabels"
import { useCourseShellLabels } from "./useCourseShellLabels"
import { useCourseSpent } from "./useCourseSpent"

/**
 * The course lesson page as the learner meets it: the record of the lesson and where they stand in every case (read again every few
 * seconds on a loop, while the relay uploads their runs), the lab of their machine for the one setup fact later pages need, the hints
 * they open and the time they spend. It resolves the words once and hands the view to the block.
 */
export const useCourseLessonScreen = (route: CourseLessonRoute): CourseLessonScreen => {
    const locale = useLocale()
    const router = navigation.useRouter()
    const session = useSession()
    const page = pageOf(route.page)
    const kind = page === "happy" ? "happy" : "unhappy"
    const reads = useCourseLessonReads(route.courseId, route.lessonId, locale, page === "happy" || page === "unhappy")
    const hints = useCourseHints({ lessonId: route.lessonId, locale, onOpened: reads.refresh })
    const spentMs = useCourseSpent(route.lessonId)
    const shell = useCourseShellLabels()
    const loops = useCourseLoopLabels()
    const pages = useCoursePageLabels()
    const slotLabelsOf = useSlotLabels()
    const { lesson } = reads
    const cases = lesson === undefined ? [] : casesOf(lesson, reads.marks)
    const selected = selectedCaseOf(loopOf(cases, kind), route.caseId, reads.marks?.currentCaseId)
    const isReady = lesson !== undefined && reads.marks !== undefined
    const view = isReady
        ? viewOf({
              route: { lessonId: route.lessonId, page, caseId: selected?.id },
              lesson,
              course: reads.course,
              cases,
              locale,
              labPhase: reads.labPhase,
              isPassed: reads.isPassed,
              hints,
              spentMs,
              shell,
              loopWords: loops.words,
              pages,
          })
        : undefined
    useDocumentTitle(view?.title)
    const isGuest = session.status === "signed-out"
    const slot = isGuest
        ? { isForbidden: true as const }
        : slotOfSwr({
              data: view,
              error: reads.error,
              isLoading: reads.isLoading || session.status === "unknown",
              isValidating: reads.isValidating,
          })
    return {
        props: {
            slot,
            placeholder: PLACEHOLDER_VIEW,
            slotLabels: slotLabelsOf(pages.intro.labels.empty),
            errorText: shell.errorText,
            labels: {
                breadcrumbs: shell.breadcrumbs,
                essentials: shell.essentials,
                tabsLabel: shell.tabsLabel,
                pages: shell.pages,
                pageTabs: COURSE_PAGES.map((id) => ({ id, label: shell.pages[id] })),
                upgrade: shell.upgrade,
                signIn: shell.signIn,
                forbidden: isGuest ? shell.forbiddenGuest : shell.forbiddenPremium,
                dismiss: shell.hintFailure.dismiss,
                intro: pages.intro.labels,
                pattern: pages.pattern.labels,
                architecture: pages.architecture.labels,
                production: pages.production.labels,
                loop: loops.labelsOf(kind, greenCountOf(cases, kind), loopOf(cases, kind).length),
            },
            catalogHref: APP_ROUTES.essentials,
            plansHref: APP_ROUTES.premium,
            isGuest,
            signInHref: signInRedirectHref(
                APP_ROUTES.signIn,
                courseLessonPath(route.courseId, route.lessonId, page, selected?.id),
            ),
        },
        on: {
            retry: reads.refresh,
            openPage: (target, caseId) => router.push(courseLessonPath(route.courseId, route.lessonId, target, caseId)),
            selectCase: (caseId) => router.replace(courseLessonPath(route.courseId, route.lessonId, page, caseId)),
            openHint: hints.open,
            dismissHint: hints.dismiss,
            openPlans: () => router.push(APP_ROUTES.premium),
        },
    }
}
