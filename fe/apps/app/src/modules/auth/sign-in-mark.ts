/** Where the browser keeps, for one tab, when a read last sent the reader to sign in again. */
const SIGN_IN_MARK_KEY = "starci.signInRedirect"

/** How long a note stays true: long enough to cover the bounce, short enough that a later visit to the sign-in screen is not held. */
const SIGN_IN_MARK_MS = 15_000

/** Notes that a read failed as unauthenticated and sent the reader to sign in, so the sign-in screen keeps its form even if the session door still answers. */
export const markSignInRedirect = (): void => {
    try {
        window.sessionStorage.setItem(SIGN_IN_MARK_KEY, String(Date.now()))
    } catch {
        return
    }
}

/** Whether a read sent the reader here to sign in again a moment ago (false on the server, or when storage is unavailable). */
export const hasSignInMark = (): boolean => {
    try {
        const at = Number(window.sessionStorage.getItem(SIGN_IN_MARK_KEY))
        return Number.isFinite(at) && at > 0 && Date.now() - at < SIGN_IN_MARK_MS
    } catch {
        return false
    }
}
