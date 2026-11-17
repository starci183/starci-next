"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type MyProfileQuery } from "@/modules/api"
import { queryMyProfile } from "@/modules/api/graphql/queries/query-my-profile"

/** Cache identity of the profile read; the viewer and the locale are part of the key. */
export const QUERY_MY_PROFILE_SWR_KEY = "QUERY_MY_PROFILE_SWR"

/** The profile as the profile screen reads it. */
export type MyProfile = MyProfileQuery["myProfile"]

/** Reads the profile of the signed-in learner in one locale. */
export const useQueryMyProfileSwr = (locale: string): SWRResponse<MyProfile> => {
    const viewer = viewerKey(`${QUERY_MY_PROFILE_SWR_KEY}:${locale}`, useViewerId())
    return useSWR<MyProfile>(viewer, async () => {
        const { data } = await failing(() => queryMyProfile({ request: { locale } }))
        if (data === undefined) throw new Error("myProfile answered no data")
        return data.myProfile
    })
}
