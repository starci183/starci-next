"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type BindHarnessBuildMutation } from "@/modules/api"
import { mutateBindHarnessBuild } from "@/modules/api/graphql/mutations/mutation-bind-harness-build"

/** Cache identity of the bind write. */
export const MUTATE_BIND_HARNESS_BUILD_SWR_KEY = "MUTATE_BIND_HARNESS_BUILD_SWR"

/** The binding the write made. */
export type HarnessBuildBinding = BindHarnessBuildMutation["bindHarnessBuild"]

/** The extra argument SWR hands the mutation fetcher: the build and the repository. */
interface BindHarnessBuildExtra {
    readonly arg: { readonly buildId: string; readonly repository: string }
}

/** Binds a repository to a build on demand; the trigger rejects with the typed failure. */
export const useMutateBindHarnessBuildSwr = (): SWRMutationResponse<
    HarnessBuildBinding,
    unknown,
    string,
    { readonly buildId: string; readonly repository: string }
> =>
    useSWRMutation<HarnessBuildBinding, unknown, string, { readonly buildId: string; readonly repository: string }>(
        MUTATE_BIND_HARNESS_BUILD_SWR_KEY,
        async (_key: string, { arg }: BindHarnessBuildExtra) => {
            const { data } = await failing(() => mutateBindHarnessBuild(arg))
            if (data === undefined) throw new Error("bindHarnessBuild answered no data")
            return data.bindHarnessBuild
        },
    )
