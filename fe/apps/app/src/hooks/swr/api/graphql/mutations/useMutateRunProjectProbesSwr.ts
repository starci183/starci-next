"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type RunProjectProbesInput, type RunProjectProbesMutation } from "@/modules/api"
import { mutateRunProjectProbes } from "@/modules/api/graphql/mutations/mutation-run-project-probes"

/** What the write answers. */
export type RunProjectProbesResult = RunProjectProbesMutation["runProjectProbes"]

/** Cache identity of the runProjectProbes write. */
export const MUTATE_RUN_PROJECT_PROBES_SWR_KEY = "MUTATE_RUN_PROJECT_PROBES_SWR"

/** The extra argument SWR hands the fetcher. */
interface RunProjectProbesExtra {
    readonly arg: RunProjectProbesInput
}

/** Probes the deployed address of a project with the generic StarCi probes; the trigger rejects with the typed failure. */
export const useMutateRunProjectProbesSwr = (): SWRMutationResponse<
    RunProjectProbesResult,
    unknown,
    string,
    RunProjectProbesInput
> =>
    useSWRMutation<RunProjectProbesResult, unknown, string, RunProjectProbesInput>(
        MUTATE_RUN_PROJECT_PROBES_SWR_KEY,
        async (_key: string, { arg }: RunProjectProbesExtra) =>
            (
                await answeredData(
                    failing(() => mutateRunProjectProbes({ request: arg })),
                    "runProjectProbes",
                )
            ).runProjectProbes,
    )
