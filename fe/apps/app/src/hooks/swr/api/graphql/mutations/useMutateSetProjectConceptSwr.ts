"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type SetProjectConceptInput, type SetProjectConceptMutation } from "@/modules/api"
import { mutateSetProjectConcept } from "@/modules/api/graphql/mutations/mutation-set-project-concept"

/** What the write answers. */
export type SetProjectConceptResult = SetProjectConceptMutation["setProjectConcept"]

/** Cache identity of the setProjectConcept write. */
export const MUTATE_SET_PROJECT_CONCEPT_SWR_KEY = "MUTATE_SET_PROJECT_CONCEPT_SWR"

/** The extra argument SWR hands the fetcher. */
interface SetProjectConceptExtra {
    readonly arg: SetProjectConceptInput
}

/** Points a concept of a project at code and at the endpoint the probes aim at; the trigger rejects with the typed failure. */
export const useMutateSetProjectConceptSwr = (): SWRMutationResponse<
    SetProjectConceptResult,
    unknown,
    string,
    SetProjectConceptInput
> =>
    useSWRMutation<SetProjectConceptResult, unknown, string, SetProjectConceptInput>(
        MUTATE_SET_PROJECT_CONCEPT_SWR_KEY,
        async (_key: string, { arg }: SetProjectConceptExtra) =>
            (
                await answeredData(
                    failing(() => mutateSetProjectConcept({ request: arg })),
                    "setProjectConcept",
                )
            ).setProjectConcept,
    )
