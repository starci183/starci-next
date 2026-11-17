"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type UpdateProjectInput, type UpdateProjectMutation } from "@/modules/api"
import { mutateUpdateProject } from "@/modules/api/graphql/mutations/mutation-update-project"

/** What the write answers. */
export type UpdateProjectResult = UpdateProjectMutation["updateProject"]

/** Cache identity of the updateProject write. */
export const MUTATE_UPDATE_PROJECT_SWR_KEY = "MUTATE_UPDATE_PROJECT_SWR"

/** The extra argument SWR hands the fetcher. */
interface UpdateProjectExtra {
    readonly arg: UpdateProjectInput
}

/** Changes a project of the signed-in learner; the trigger rejects with the typed failure. */
export const useMutateUpdateProjectSwr = (): SWRMutationResponse<
    UpdateProjectResult,
    unknown,
    string,
    UpdateProjectInput
> =>
    useSWRMutation<UpdateProjectResult, unknown, string, UpdateProjectInput>(
        MUTATE_UPDATE_PROJECT_SWR_KEY,
        async (_key: string, { arg }: UpdateProjectExtra) =>
            (
                await answeredData(
                    failing(() => mutateUpdateProject({ request: arg })),
                    "updateProject",
                )
            ).updateProject,
    )
