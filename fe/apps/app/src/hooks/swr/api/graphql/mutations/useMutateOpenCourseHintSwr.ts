"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type OpenCourseHintInput, type OpenCourseHintMutation } from "@/modules/api"
import { mutateOpenCourseHint } from "@/modules/api/graphql/mutations/mutation-open-course-hint"

/** Cache identity of the open-course-hint write. */
export const MUTATE_OPEN_COURSE_HINT_SWR_KEY = "MUTATE_OPEN_COURSE_HINT_SWR"

/** The hint the back end opened: its case, its level and its text. */
export type OpenedCourseHint = OpenCourseHintMutation["openCourseHint"]

/**
 * Opens one level of a case's hint ladder; the trigger rejects with the typed failure (COURSE_PREMIUM_REQUIRED,
 * COURSE_CASE_LOCKED, COURSE_HINT_OUT_OF_ORDER).
 */
export const useMutateOpenCourseHintSwr = (): SWRMutationResponse<
    OpenedCourseHint,
    unknown,
    string,
    OpenCourseHintInput
> =>
    useSWRMutation<OpenedCourseHint, unknown, string, OpenCourseHintInput>(
        MUTATE_OPEN_COURSE_HINT_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: OpenCourseHintInput }) => {
            const { data } = await failing(() => mutateOpenCourseHint({ request: arg }))
            if (data === undefined) throw new Error("openCourseHint answered no data")
            return data.openCourseHint
        },
    )
