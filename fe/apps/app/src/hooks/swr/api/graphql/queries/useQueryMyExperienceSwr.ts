"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { answeredData, failing, type MyExperienceQuery } from "@/modules/api"
import { queryMyExperience } from "@/modules/api/graphql/queries/query-my-experience"

/** Cache identity of the myExperience read; the viewer is part of the key. */
export const QUERY_MY_EXPERIENCE_SWR_KEY = "QUERY_MY_EXPERIENCE_SWR"

/** The learner's experience items and the hiring threshold. */
export type MyExperienceView = MyExperienceQuery["myExperience"]

/** Reads the signed-in learner's experience items, optionally of one state; a failure stays the read's error. */
export const useQueryMyExperienceSwr = (state: string | undefined): SWRResponse<MyExperienceView> => {
    const viewer = viewerKey(QUERY_MY_EXPERIENCE_SWR_KEY, useViewerId())
    return useSWR<MyExperienceView>(
        viewer === null ? null : [...viewer, state ?? "all"],
        async () =>
            (
                await answeredData(
                    failing(() => queryMyExperience({ request: { state: state ?? null } })),
                    "myExperience",
                )
            ).myExperience,
    )
}
