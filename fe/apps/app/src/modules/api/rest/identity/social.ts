import type { GraphQLResponse } from "../../graphql"
import { postDoor } from "./door"

/** The providers the sign-in screen offers. */
export type SocialProvider = "facebook" | "github"

/** Reads one string field of an answer body. */
const stringField = (data: unknown, name: string): string | undefined => {
    if (typeof data !== "object" || data === null) return undefined
    const value: unknown = Object.entries(data).find(([key]) => key === name)?.[1]
    return typeof value === "string" ? value : undefined
}

/** Asks the back end for the provider's authorization URL; the browser then goes there. */
export const startSocialSignIn = (
    provider: SocialProvider,
    returnTo: string | undefined,
): Promise<GraphQLResponse<string>> =>
    postDoor("/api/identity/social/start", { provider, returnTo }, (data) => stringField(data, "authorizationUrl"))

/** Sends the provider's code and state once; a success sets the session cookie and answers the path to return to. */
export const exchangeSocialCode = (code: string, state: string): Promise<GraphQLResponse<string>> =>
    postDoor("/api/identity/social/exchange", { code, state }, (data) => stringField(data, "returnTo"))
