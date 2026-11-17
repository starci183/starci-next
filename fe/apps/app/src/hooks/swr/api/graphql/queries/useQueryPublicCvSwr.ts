"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type PublicCvQuery } from "@/modules/api"
import { queryPublicCv } from "@/modules/api/graphql/queries/query-public-cv"

/** Cache identity of the public CV read; the slug and the locale are part of the key. */
export const QUERY_PUBLIC_CV_SWR_KEY = "QUERY_PUBLIC_CV_SWR"

/** The public CV as the public page reads it. */
export type PublicCv = PublicCvQuery["publicCv"]

/** Reads the public CV behind a slug in one locale; no sign-in is needed. */
export const useQueryPublicCvSwr = (slug: string, locale: string): SWRResponse<PublicCv> =>
    useSWR<PublicCv>(`${QUERY_PUBLIC_CV_SWR_KEY}:${slug}:${locale}`, async () => {
        const { data } = await failing(() => queryPublicCv({ request: { slug, locale } }))
        if (data === undefined) throw new Error("publicCv answered no data")
        return data.publicCv
    })
