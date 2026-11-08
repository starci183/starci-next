"use client"

import useSWR from "swr"
import { readSession, type IdentitySession } from "@/modules/api"

/** What useGetIdentitySessionSwr answers: the reader the session door verifies (undefined when signed out) and whether the first read is still running. */
export type GetIdentitySessionHook = {
    readonly session: IdentitySession | undefined
    readonly loading: boolean
}

/** Reads the verified session through the session door once, wrapped in SWR so no other file calls the REST operation. */
export const useGetIdentitySessionSwr = (): GetIdentitySessionHook => {
    const { data, isLoading } = useSWR<IdentitySession | null>(
        "identity-session",
        async () => (await readSession()) ?? null,
        {
            revalidateOnFocus: false,
        },
    )
    return { session: data ?? undefined, loading: isLoading }
}
