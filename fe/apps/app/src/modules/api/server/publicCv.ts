import { cache } from "react"
import { print } from "graphql"
import { siteUrl } from "@/modules/config"
import { publicCvDocument } from "../graphql/queries/query-public-cv"
import type { PublicCvQuery } from "../graphql/__generated__/graphql"

/** The codes the door answers for a link nobody owns or whose owner keeps it private: both read as one not found. */
export const PUBLIC_CV_NOT_FOUND_CODES: ReadonlySet<string> = new Set([
    "PROFILE_CV_NOT_FOUND",
    "HTTP_SECURITY_REQUEST_INVALID",
])

/** The window the server read may take before the page reads in the browser instead. */
const TIMEOUT_MS = 3000

/** What the server learned about a link: the CV, that there is none, or that it could not tell. */
export type PublicCvRead =
    | { readonly status: "found"; readonly cv: PublicCvQuery["publicCv"] }
    | { readonly status: "notFound" }
    | { readonly status: "unavailable" }

/** The shape of a GraphQL answer the read needs: the data, or the stable code of the first refusal. */
type Answer = {
    readonly data?: PublicCvQuery | null
    readonly errors?: ReadonlyArray<{ readonly extensions?: { readonly code?: unknown } }>
}

/**
 * Reads the public CV of a link on the server, for the page metadata, the preview image and the HTTP status of a missing CV. It goes
 * through the app's own `/graphql` door (the ingress in production, the dev proxy otherwise), with no session. A slow or failing core
 * is `unavailable`, never a thrown error, so the page still draws and reads in the browser. One request shares one read.
 */
export const readPublicCv = cache(async (slug: string, locale: string): Promise<PublicCvRead> => {
    try {
        const response = await fetch(`${siteUrl()}/graphql`, {
            method: "POST",
            headers: { "content-type": "application/json", "accept-language": locale },
            body: JSON.stringify({ query: print(publicCvDocument), variables: { input: { slug, locale } } }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: "no-store",
        })
        const answer = (await response.json()) as Answer
        if (answer.data?.publicCv !== undefined) return { status: "found", cv: answer.data.publicCv }
        const code = answer.errors?.[0]?.extensions?.code
        return typeof code === "string" && PUBLIC_CV_NOT_FOUND_CODES.has(code)
            ? { status: "notFound" }
            : { status: "unavailable" }
    } catch {
        return { status: "unavailable" }
    }
})
