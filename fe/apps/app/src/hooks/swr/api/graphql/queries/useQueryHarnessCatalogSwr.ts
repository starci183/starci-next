"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { readHarnessCatalog } from "@/modules/harness-source"
import type { HarnessCatalogView } from "@/modules/types"

/** Cache identity of the harness catalog; the viewer and the language are part of the key. */
export const QUERY_HARNESS_CATALOG_SWR_KEY = "QUERY_HARNESS_CATALOG_SWR"

/** How often the catalog is read again, so a `harness doctor` or a trial run from the terminal shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads the builds, the guides, the articles, the doctor results and the trials of the harness area in one language. */
export const useQueryHarnessCatalogSwr = (locale: string): SWRResponse<HarnessCatalogView> => {
    const viewer = viewerKey(QUERY_HARNESS_CATALOG_SWR_KEY, useViewerId())
    return useSWR<HarnessCatalogView>(viewer === null ? null : [...viewer, locale], () => readHarnessCatalog(locale), {
        refreshInterval: IDLE_POLL_MS,
    })
}
