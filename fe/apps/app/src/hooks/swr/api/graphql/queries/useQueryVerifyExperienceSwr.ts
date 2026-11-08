"use client"

import useSWR, { type SWRResponse } from "swr"
import { answeredData, failing, type VerifyExperienceQuery } from "@/modules/api"
import { queryVerifyExperience } from "@/modules/api/graphql/queries/query-verify-experience"

/** Cache identity of the public verification read; the code is part of the key, no viewer is. */
export const QUERY_VERIFY_EXPERIENCE_SWR_KEY = "QUERY_VERIFY_EXPERIENCE_SWR"

/** What /verify/{code} shows. */
export type VerificationView = VerifyExperienceQuery["verifyExperience"]

/** Reads the public verification of one code; it needs no session, and an unknown code is a settled refusal. */
export const useQueryVerifyExperienceSwr = (code: string): SWRResponse<VerificationView> =>
    useSWR<VerificationView>(
        [QUERY_VERIFY_EXPERIENCE_SWR_KEY, code],
        async () =>
            (
                await answeredData(
                    failing(() => queryVerifyExperience({ request: { code } })),
                    "verifyExperience",
                )
            ).verifyExperience,
        { shouldRetryOnError: false },
    )
