"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type SetCourseLabChaosInput, type SetCourseLabChaosMutation } from "@/modules/api"
import { mutateSetCourseLabChaos } from "@/modules/api/graphql/mutations/mutation-set-course-lab-chaos"

/** Cache identity of the set-course-lab-chaos write. */
export const MUTATE_SET_COURSE_LAB_CHAOS_SWR_KEY = "MUTATE_SET_COURSE_LAB_CHAOS_SWR"

/** What the machine answers: the device the manifest went to, the action and the manifest id. */
export type SetCourseLabChaosRequested = SetCourseLabChaosMutation["setCourseLabChaos"]

/** Sets the chaos switches that are on in the lab; the trigger rejects with the typed failure. */
export const useMutateSetCourseLabChaosSwr = (): SWRMutationResponse<
    SetCourseLabChaosRequested,
    unknown,
    string,
    SetCourseLabChaosInput
> =>
    useSWRMutation<SetCourseLabChaosRequested, unknown, string, SetCourseLabChaosInput>(
        MUTATE_SET_COURSE_LAB_CHAOS_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: SetCourseLabChaosInput }) => {
            const { data } = await failing(() => mutateSetCourseLabChaos({ request: arg }))
            if (data === undefined) throw new Error("setCourseLabChaos answered no data")
            return data.setCourseLabChaos
        },
    )
