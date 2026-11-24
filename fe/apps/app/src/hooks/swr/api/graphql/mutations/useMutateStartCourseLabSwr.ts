"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type CourseLabInput, type StartCourseLabMutation } from "@/modules/api"
import { mutateStartCourseLab } from "@/modules/api/graphql/mutations/mutation-start-course-lab"

/** Cache identity of the start-course-lab write. */
export const MUTATE_START_COURSE_LAB_SWR_KEY = "MUTATE_START_COURSE_LAB_SWR"

/** What the machine answers: the device the manifest went to, the action and the manifest id. */
export type StartCourseLabRequested = StartCourseLabMutation["startCourseLab"]

/** Asks the learner's machine to boot the lab of one lesson; the trigger rejects with the typed failure (RELAY_DEVICE_OFFLINE, RELAY_LAB_PREMIUM_REQUIRED). */
export const useMutateStartCourseLabSwr = (): SWRMutationResponse<
    StartCourseLabRequested,
    unknown,
    string,
    CourseLabInput
> =>
    useSWRMutation<StartCourseLabRequested, unknown, string, CourseLabInput>(
        MUTATE_START_COURSE_LAB_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: CourseLabInput }) => {
            const { data } = await failing(() => mutateStartCourseLab({ request: arg }))
            if (data === undefined) throw new Error("startCourseLab answered no data")
            return data.startCourseLab
        },
    )
