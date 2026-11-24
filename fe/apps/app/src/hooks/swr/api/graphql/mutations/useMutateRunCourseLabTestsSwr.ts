"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type CourseLabInput, type RunCourseLabTestsMutation } from "@/modules/api"
import { mutateRunCourseLabTests } from "@/modules/api/graphql/mutations/mutation-run-course-lab-tests"

/** Cache identity of the run-course-lab-tests write. */
export const MUTATE_RUN_COURSE_LAB_TESTS_SWR_KEY = "MUTATE_RUN_COURSE_LAB_TESTS_SWR"

/** What the machine answers: the device the manifest went to, the action and the manifest id. */
export type RunCourseLabTestsRequested = RunCourseLabTestsMutation["runCourseLabTests"]

/** Asks the learner's machine to run the visible tests of the lab; the trigger rejects with the typed failure. */
export const useMutateRunCourseLabTestsSwr = (): SWRMutationResponse<
    RunCourseLabTestsRequested,
    unknown,
    string,
    CourseLabInput
> =>
    useSWRMutation<RunCourseLabTestsRequested, unknown, string, CourseLabInput>(
        MUTATE_RUN_COURSE_LAB_TESTS_SWR_KEY,
        async (_key: string, { arg }: { readonly arg: CourseLabInput }) => {
            const { data } = await failing(() => mutateRunCourseLabTests({ request: arg }))
            if (data === undefined) throw new Error("runCourseLabTests answered no data")
            return data.runCourseLabTests
        },
    )
