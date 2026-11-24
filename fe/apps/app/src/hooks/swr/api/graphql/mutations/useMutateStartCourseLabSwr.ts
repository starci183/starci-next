"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type StartCourseLabInput, type StartCourseLabMutation } from "@/modules/api"
import { mutateStartCourseLab } from "@/modules/api/graphql/mutations/mutation-start-course-lab"

/** Cache identity of the start-course-lab write. */
export const MUTATE_START_COURSE_LAB_SWR_KEY = "MUTATE_START_COURSE_LAB_SWR"

/** What the machine answers: the device the manifest went to, the action and the manifest id. */
export type StartCourseLabRequested = StartCourseLabMutation["startCourseLab"]

/** The input of the start write, as the trigger takes it. */
type StartCourseLabArg = { readonly arg: StartCourseLabInput }

/** Asks the learner's machine to boot the lab of one lesson in the folder `dir` names (the default folder without it); the trigger rejects with the typed failure (RELAY_DEVICE_OFFLINE, RELAY_LAB_PREMIUM_REQUIRED). */
export const useMutateStartCourseLabSwr = (): SWRMutationResponse<
    StartCourseLabRequested,
    unknown,
    string,
    StartCourseLabInput
> =>
    useSWRMutation<StartCourseLabRequested, unknown, string, StartCourseLabInput>(
        MUTATE_START_COURSE_LAB_SWR_KEY,
        async (_key: string, { arg }: StartCourseLabArg) => {
            const { data } = await failing(() => mutateStartCourseLab({ request: arg }))
            if (data === undefined) throw new Error("startCourseLab answered no data")
            return data.startCourseLab
        },
    )
