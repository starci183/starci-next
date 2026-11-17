"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryHarnessDoctor } from "@/modules/api/graphql/queries/query-harness-doctor"
import { doctorOf } from "@/modules/harness-view"
import type { HarnessDoctorView, HarnessTool } from "@/modules/types"

/** Cache identity of this read; the viewer and every argument are part of the key. */
export const QUERY_HARNESS_DOCTOR_SWR_KEY = "QUERY_HARNESS_DOCTOR_SWR_KEY"

/** How often the read is made again, so a result the CLI relays from the learner machine shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads the doctor result of one tool, probe by probe. */
export const useQueryHarnessDoctorSwr = (tool: HarnessTool, locale: string): SWRResponse<HarnessDoctorView> => {
    const viewer = viewerKey(QUERY_HARNESS_DOCTOR_SWR_KEY, useViewerId())
    return useSWR<HarnessDoctorView>(
        viewer === null ? null : [...viewer, tool, locale],
        async () => {
            const { data } = await failing(() => queryHarnessDoctor({ request: { tool, locale } }))
            if (data === undefined) throw new Error("harnessDoctor answered no data")
            return doctorOf(data.harnessDoctor)
        },
        { refreshInterval: IDLE_POLL_MS },
    )
}
