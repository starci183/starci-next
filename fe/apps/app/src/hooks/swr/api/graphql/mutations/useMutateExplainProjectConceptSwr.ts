"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import {
    answeredData,
    failing,
    type ExplainProjectConceptInput,
    type ExplainProjectConceptMutation,
} from "@/modules/api"
import { mutateExplainProjectConcept } from "@/modules/api/graphql/mutations/mutation-explain-project-concept"

/** What the write answers. */
export type ExplainProjectConceptResult = ExplainProjectConceptMutation["explainProjectConcept"]

/** Cache identity of the explainProjectConcept write. */
export const MUTATE_EXPLAIN_PROJECT_CONCEPT_SWR_KEY = "MUTATE_EXPLAIN_PROJECT_CONCEPT_SWR"

/** The extra argument SWR hands the fetcher. */
interface ExplainProjectConceptExtra {
    readonly arg: ExplainProjectConceptInput
}

/** Has the AI teacher read the code a concept points to and the learner's explanation; the trigger rejects with the typed failure. */
export const useMutateExplainProjectConceptSwr = (): SWRMutationResponse<
    ExplainProjectConceptResult,
    unknown,
    string,
    ExplainProjectConceptInput
> =>
    useSWRMutation<ExplainProjectConceptResult, unknown, string, ExplainProjectConceptInput>(
        MUTATE_EXPLAIN_PROJECT_CONCEPT_SWR_KEY,
        async (_key: string, { arg }: ExplainProjectConceptExtra) =>
            (
                await answeredData(
                    failing(() => mutateExplainProjectConcept({ request: arg })),
                    "explainProjectConcept",
                )
            ).explainProjectConcept,
    )
