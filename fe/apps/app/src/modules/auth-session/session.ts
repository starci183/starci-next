import { authClient, type AuthSession } from "@/modules/auth"

/** The access token of the current session, refreshed when missing or about to expire; `undefined` when signed out. */
export const sessionAccessToken = (): Promise<string | undefined> => authClient.accessToken()

/** Calls `listener` with the session (undefined when signed out) now and on every sign-in, sign-out and token refresh; answers the function that stops listening. */
export const subscribeToSession = (listener: (session: AuthSession | undefined) => void): (() => void) =>
    authClient.onChange(listener)

/** Signs in with email and password; a failure carries the wire code. */
export const signInWithPassword = (email: string, password: string): ReturnType<typeof authClient.signInWithPassword> =>
    authClient.signInWithPassword(email, password)

/** Ends the session on the back end (it clears the cookie) and forgets the token here, even when the call fails. */
export const endSession = async (): Promise<void> => {
    await authClient.signOut()
}
