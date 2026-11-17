"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { answeredData, failing, type ExperienceReviewersQuery } from "@/modules/api"
import { queryExperienceReviewers } from "@/modules/api/graphql/queries/query-experience-reviewers"

/** Cache identity of the experienceReviewers read; the viewer is part of the key. */
export const QUERY_EXPERIENCE_REVIEWERS_SWR_KEY = "QUERY_EXPERIENCE_REVIEWERS_SWR"

/** The active reviewer appointments. */
export type ExperienceReviewersView = ExperienceReviewersQuery["experienceReviewers"]

/** Reads the reviewer appointments; idle unless the reader is the teacher. */
export const useQueryExperienceReviewersSwr = (isEnabled: boolean): SWRResponse<ExperienceReviewersView> => {
    const viewer = viewerKey(QUERY_EXPERIENCE_REVIEWERS_SWR_KEY, useViewerId())
    return useSWR<ExperienceReviewersView>(
        viewer === null || !isEnabled ? null : viewer,
        async () =>
            (
                await answeredData(
                    failing(() => queryExperienceReviewers({ request: {} })),
                    "experienceReviewers",
                )
            ).experienceReviewers,
    )
}
