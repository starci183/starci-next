"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import {
    answeredData,
    failing,
    type RotateProjectCiSecretInput,
    type RotateProjectCiSecretMutation,
} from "@/modules/api"
import { mutateRotateProjectCiSecret } from "@/modules/api/graphql/mutations/mutation-rotate-project-ci-secret"

/** What the write answers. */
export type RotateProjectCiSecretResult = RotateProjectCiSecretMutation["rotateProjectCiSecret"]

/** Cache identity of the rotateProjectCiSecret write. */
export const MUTATE_ROTATE_PROJECT_CI_SECRET_SWR_KEY = "MUTATE_ROTATE_PROJECT_CI_SECRET_SWR"

/** The extra argument SWR hands the fetcher. */
interface RotateProjectCiSecretExtra {
    readonly arg: RotateProjectCiSecretInput
}

/** Replaces the CI secret of a project and answers the new one, shown once; the trigger rejects with the typed failure. */
export const useMutateRotateProjectCiSecretSwr = (): SWRMutationResponse<
    RotateProjectCiSecretResult,
    unknown,
    string,
    RotateProjectCiSecretInput
> =>
    useSWRMutation<RotateProjectCiSecretResult, unknown, string, RotateProjectCiSecretInput>(
        MUTATE_ROTATE_PROJECT_CI_SECRET_SWR_KEY,
        async (_key: string, { arg }: RotateProjectCiSecretExtra) =>
            (
                await answeredData(
                    failing(() => mutateRotateProjectCiSecret({ request: arg })),
                    "rotateProjectCiSecret",
                )
            ).rotateProjectCiSecret,
    )
