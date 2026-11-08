"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateMarkNotificationsRead } from "@/modules/api/graphql/mutations/mutation-mark-notifications-read"

/** Cache identity of the mark-read write. */
export const MUTATE_MARK_NOTIFICATIONS_READ_SWR_KEY = "MUTATE_MARK_NOTIFICATIONS_READ_SWR"

/** What one mark-read call takes: the ids to mark, or all of the reader's. */
export interface MarkNotificationsReadArgument {
    readonly ids?: ReadonlyArray<string> | undefined
    readonly all?: boolean | undefined
}

/** The extra argument SWR hands the mutation fetcher. */
interface MarkNotificationsReadExtra {
    readonly arg: MarkNotificationsReadArgument
}

/** Marks notifications read on demand; the trigger answers how many changed and rejects with the typed failure. */
export const useMutateMarkNotificationsReadSwr = (): SWRMutationResponse<
    number,
    unknown,
    string,
    MarkNotificationsReadArgument
> =>
    useSWRMutation<number, unknown, string, MarkNotificationsReadArgument>(
        MUTATE_MARK_NOTIFICATIONS_READ_SWR_KEY,
        async (_key: string, { arg }: MarkNotificationsReadExtra) => {
            const { data } = await failing(() => mutateMarkNotificationsRead({ ids: arg.ids, all: arg.all }))
            if (data === undefined) throw new Error("markNotificationsRead answered no data")
            return data.markNotificationsRead
        },
    )
