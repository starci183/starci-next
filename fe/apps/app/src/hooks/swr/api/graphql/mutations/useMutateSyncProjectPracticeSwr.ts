"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { answeredData, failing, type SyncProjectPracticeInput, type SyncProjectPracticeMutation } from "@/modules/api"
import { mutateSyncProjectPractice } from "@/modules/api/graphql/mutations/mutation-sync-project-practice"

/** What the write answers. */
export type SyncProjectPracticeResult = SyncProjectPracticeMutation["syncProjectPractice"]

/** Cache identity of the syncProjectPractice write. */
export const MUTATE_SYNC_PROJECT_PRACTICE_SWR_KEY = "MUTATE_SYNC_PROJECT_PRACTICE_SWR"

/** The extra argument SWR hands the fetcher. */
interface SyncProjectPracticeExtra {
    readonly arg: SyncProjectPracticeInput
}

/** Pulls the results the learner machine reported over the relay into a project; the trigger rejects with the typed failure. */
export const useMutateSyncProjectPracticeSwr = (): SWRMutationResponse<
    SyncProjectPracticeResult,
    unknown,
    string,
    SyncProjectPracticeInput
> =>
    useSWRMutation<SyncProjectPracticeResult, unknown, string, SyncProjectPracticeInput>(
        MUTATE_SYNC_PROJECT_PRACTICE_SWR_KEY,
        async (_key: string, { arg }: SyncProjectPracticeExtra) =>
            (
                await answeredData(
                    failing(() => mutateSyncProjectPractice({ request: arg })),
                    "syncProjectPractice",
                )
            ).syncProjectPractice,
    )
