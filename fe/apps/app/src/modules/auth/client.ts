import type { AuthClient, AuthFailure } from "./contracts"
import { AUTH_DOORS, readSession } from "./auth-door"

/** Why a sign-in or sign-out cannot run where there is no document to post the door navigation through. */
const DOOR_UNAVAILABLE: AuthFailure = { code: "AUTH_SESSION_DOOR_UNAVAILABLE", kind: "unavailable", message: "" }

/** Password sign-in is not a door of the identity contract: the shared edition interface answers a permanent refusal. */
const PASSWORD_UNSUPPORTED: AuthFailure = { code: "AUTH_PASSWORD_SIGN_IN_UNSUPPORTED", kind: "unavailable", message: "" }

/**
 * Posts the browser's own navigation to an application session door: the door answers `303 See Other` — the provider
 * handshake on the way in, the return to `/sign-in` on the way out — which no XHR may follow, so the document posts a
 * native form and leaves. The posted body is empty; the door checks only the same-origin `Origin` the browser sends.
 */
const postDoorAndLeave = (path: string): Promise<AuthFailure | undefined> => {
    if (typeof document === "undefined") return Promise.resolve(DOOR_UNAVAILABLE)
    const form = document.createElement("form")
    form.method = "post"
    form.action = path
    document.body.appendChild(form)
    form.submit()
    return Promise.resolve(undefined)
}

/**
 * The identity client of the app, on the doors of auth-door: `session` reads the session door, `signIn` and `signOut`
 * post the browser to their doors and leave on the door's redirect, `onChange` reports the session the reader has now
 * (the door is the only truth; a fresh navigation reads it again) and the token calls answer nothing — the OIDC session
 * is an opaque cookie the JavaScript never reads, so the Apollo link attaches no bearer in this slice.
 */
export const authClient: AuthClient = {
    session: readSession,
    accessToken: () => Promise.resolve(undefined),
    refreshAccessToken: () => Promise.resolve(undefined),
    signIn: () => postDoorAndLeave(AUTH_DOORS.signIn),
    signInWithPassword: () => Promise.resolve(PASSWORD_UNSUPPORTED),
    signOut: () => postDoorAndLeave(AUTH_DOORS.signOut),
    onChange: (listener) => {
        let open = true
        void readSession().then((session) => {
            if (open) listener(session)
        })
        return () => {
            open = false
        }
    },
}
