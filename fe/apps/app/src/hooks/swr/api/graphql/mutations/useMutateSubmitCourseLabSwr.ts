"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type SubmitCourseLabInput, type SubmitCourseLabMutation } from "@/modules/api"
import { mutateSubmitCourseLab } from "@/modules/api/graphql/mutations/mutation-submit-course-lab"

/** Cache identity of the submit-course-lab write. */
export const MUTATE_SUBMIT_COURSE_LAB_SWR_KEY = "MUTATE_SUBMIT_COURSE_LAB_SWR"

/** What the machine answers: the device the manifest went to, the action and the manifest id. */
export type SubmitCourseLabRequested = SubmitCourseLabMutation["submitCourseLab"]

/** Submits the lab so the learner's machine grades it; the trigger rejects with the typed failure (RELAY_LAB_SUBMISSION_RUNNING, RELAY_DEVICE_KEY_MISSING). */
export const useMutateSubmitCourseLabSwr = (): SWRMutationResponse<
    SubmitCourseLabRequested,
    unknown,
    string,
    SubmitCourseLabInput
> =>
    useSWRMutation<SubmitCourseLabRequested, unknown, string, SubmitCourseLabInput>(
        MUTATE_SUBMIT_COURSE_LAB_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: SubmitCourseLabInput }) => {
            const { data } = await failing(() => mutateSubmitCourseLab({ request: arg }))
            if (data === undefined) throw new Error("submitCourseLab answered no data")
            return data.submitCourseLab
        },
    )
