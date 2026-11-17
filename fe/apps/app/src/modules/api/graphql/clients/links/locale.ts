import { SetContextLink } from "@apollo/client/link/context"

/** The headers an earlier link set, when they are a plain record. */
const headersOf = (headers: unknown): Record<string, string> =>
    typeof headers === "object" && headers !== null ? Object.fromEntries(Object.entries(headers)) : {}

/** Attaches the language of the page as `Accept-Language`, so a failure comes back localized by the back end. */
export const createAttachLocaleLink = (): SetContextLink =>
    new SetContextLink((previous) => ({
        headers: {
            ...(typeof document === "undefined" ? {} : { "Accept-Language": document.documentElement.lang }),
            ...headersOf(previous.headers),
        },
    }))
