"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLesson } from "@/modules/api/graphql/queries/query-lesson"
import { lessonOf, variantsOfFiles } from "@/modules/lesson-view"
import type { LessonView } from "@/modules/types"

/** Cache identity of the languages read; the viewer, the locale and the lesson ids are part of the key. */
export const QUERY_LESSON_LANGUAGES_SWR_KEY = "QUERY_LESSON_LANGUAGES_SWR"

/** The language ids a lesson's lab ships: the workspaces, then the language folders of its exercise files, once each. */
const languageIdsOf = (lesson: LessonView): ReadonlyArray<string> => {
    const fromFiles = lesson.sections.flatMap((section) =>
        section.activities.flatMap((activity) => variantsOfFiles(activity.files)),
    )
    return [...new Set([...lesson.workspaces, ...fromFiles].map((each) => each.id))]
}

/**
 * Reads, for each given lesson, the implementation languages its lab ships (the workspaces and the language folders of its exercise
 * files), in the switch's order, by lesson id. The catalog's own `languages` only name the main language, so a chapter reads the lessons.
 */
export const useGetLessonLanguagesSwr = (
    lessonIds: ReadonlyArray<string>,
    locale: string,
): SWRResponse<Readonly<Record<string, ReadonlyArray<string>>>> => {
    const viewer = viewerKey(QUERY_LESSON_LANGUAGES_SWR_KEY, useViewerId())
    return useSWR<Readonly<Record<string, ReadonlyArray<string>>>>(
        viewer === null || lessonIds.length === 0 ? null : [...viewer, locale, ...lessonIds],
        async () => {
            const entries = await Promise.all(
                lessonIds.map(async (id) => {
                    const { data } = await failing(() => queryLesson({ request: { id, locale } }))
                    if (data === undefined) throw new Error("lesson answered no data")
                    return [id, languageIdsOf(lessonOf(data.lesson))] as const
                }),
            )
            return Object.fromEntries(entries)
        },
    )
}
