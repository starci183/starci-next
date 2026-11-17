"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type CreateProjectInput, type CreateProjectMutation } from "@/modules/api"
import { mutateCreateProject } from "@/modules/api/graphql/mutations/mutation-create-project"

/** What the write answers. */
export type CreateProjectResult = CreateProjectMutation["createProject"]

/** Cache identity of the createProject write. */
export const MUTATE_CREATE_PROJECT_SWR_KEY = "MUTATE_CREATE_PROJECT_SWR"

/** The extra argument SWR hands the fetcher. */
interface CreateProjectExtra {
    readonly arg: CreateProjectInput
}

/** Creates a project and answers it with its CI secret, shown once; the trigger rejects with the typed failure. */
export const useMutateCreateProjectSwr = (): SWRMutationResponse<
    CreateProjectResult,
    unknown,
    string,
    CreateProjectInput
> =>
    useSWRMutation<CreateProjectResult, unknown, string, CreateProjectInput>(
        MUTATE_CREATE_PROJECT_SWR_KEY,
        async (_key: string, { arg }: CreateProjectExtra) =>
            (
                await answeredData(
                    failing(() => mutateCreateProject({ request: arg })),
                    "createProject",
                )
            ).createProject,
    )
