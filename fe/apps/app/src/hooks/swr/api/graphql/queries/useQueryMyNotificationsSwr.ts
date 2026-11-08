"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type MyNotificationsQuery } from "@/modules/api"
import { queryMyNotifications } from "@/modules/api/graphql/queries/query-my-notifications"

/** Cache identity of the notifications read; the SWR cache is already scoped to the viewer on screen. */
export const QUERY_MY_NOTIFICATIONS_SWR_KEY = "QUERY_MY_NOTIFICATIONS_SWR"

/** The reader's notifications: the newest page and the unread count. */
export type MyNotifications = MyNotificationsQuery["myNotifications"]

/** Reads the reader's notifications; `isEnabled` is false while there is no session, since every door needs one. A new notice shows on the next focus or visit. */
export const useQueryMyNotificationsSwr = (isEnabled: boolean): SWRResponse<MyNotifications> =>
    useSWR<MyNotifications>(isEnabled ? QUERY_MY_NOTIFICATIONS_SWR_KEY : null, async () => {
        const { data } = await failing(() => queryMyNotifications({ limit: 10 }))
        if (data === undefined) throw new Error("myNotifications answered no data")
        return data.myNotifications
    })
