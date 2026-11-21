import { SetContextLink } from "@apollo/client/link/context"
import { sessionAccessToken } from "@/modules/auth-session"

/** The headers an earlier link set, when they are a plain record. */
const headersOf = (headers: unknown): Record<string, string> =>
    typeof headers === "object" && headers !== null ? Object.fromEntries(Object.entries(headers)) : {}

/** Attaches the access token of the session as the Bearer credential of the operation; a signed-out reader sends none (public reads need none). */
export const createAttachTokenLink = (): SetContextLink =>
    new SetContextLink(async (previous) => {
        const token = await sessionAccessToken()
        return {
            headers: {
                ...headersOf(previous.headers),
                ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
            },
        }
    })
