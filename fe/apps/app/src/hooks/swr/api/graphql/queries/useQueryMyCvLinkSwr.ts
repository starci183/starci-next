"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type MyCvLinkQuery } from "@/modules/api"
import { queryMyCvLink } from "@/modules/api/graphql/queries/query-my-cv-link"

/** Cache identity of the CV link read; the viewer is part of the key. */
export const QUERY_MY_CV_LINK_SWR_KEY = "QUERY_MY_CV_LINK_SWR"

/** The CV link of the learner: its slug and path, whether it is public and how many verified lines it holds. */
export type MyCvLink = MyCvLinkQuery["myCvLink"]

/** Reads the combined CV link of the signed-in learner. */
export const useQueryMyCvLinkSwr = (): SWRResponse<MyCvLink> =>
    useSWR<MyCvLink>(viewerKey(QUERY_MY_CV_LINK_SWR_KEY, useViewerId()), async () => {
        const { data } = await failing(() => queryMyCvLink())
        if (data === undefined) throw new Error("myCvLink answered no data")
        return data.myCvLink
    })
