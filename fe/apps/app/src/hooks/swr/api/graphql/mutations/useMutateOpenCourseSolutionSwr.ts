"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type OpenCourseSolutionInput, type OpenCourseSolutionMutation } from "@/modules/api"
import { mutateOpenCourseSolution } from "@/modules/api/graphql/mutations/mutation-open-course-solution"

/** Cache identity of the open-course-solution write. */
export const MUTATE_OPEN_COURSE_SOLUTION_SWR_KEY = "MUTATE_OPEN_COURSE_SOLUTION_SWR"

/** The solution the back end recorded as opened: its case and whether its fix is revealed. */
export type OpenedCourseSolution = OpenCourseSolutionMutation["openCourseSolution"]

/**
 * Records that the learner opened a case's solution ("Kẹt quá? Xem lời giải"); idempotent on the back end. The trigger rejects with the
 * typed failure (COURSE_PREMIUM_REQUIRED, COURSE_CASE_LOCKED).
 */
export const useMutateOpenCourseSolutionSwr = (): SWRMutationResponse<
    OpenedCourseSolution,
    unknown,
    string,
    OpenCourseSolutionInput
> =>
    useSWRMutation<OpenedCourseSolution, unknown, string, OpenCourseSolutionInput>(
        MUTATE_OPEN_COURSE_SOLUTION_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: OpenCourseSolutionInput }) => {
            const { data } = await failing(() => mutateOpenCourseSolution({ request: arg }))
            if (data === undefined) throw new Error("openCourseSolution answered no data")
            return data.openCourseSolution
        },
    )
