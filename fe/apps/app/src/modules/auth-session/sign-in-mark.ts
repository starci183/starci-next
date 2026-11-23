/** Where the browser keeps, for one tab, that a read sent the reader to sign in again. */
const SIGN_IN_MARK_KEY = "starci.signInRedirect"

/**
 * Notes that a read failed as unauthenticated and sent the reader to sign in, so the sign-in screen keeps its form even if the session
 * door still answers. The note holds until a sign-in finishes in this tab ({@link clearSignInMark}): a session that some read refuses
 * never sends the reader back to that read, however many times the sign-in screen loads.
 */
export const markSignInRedirect = (): void => {
    try {
        window.sessionStorage.setItem(SIGN_IN_MARK_KEY, String(Date.now()))
    } catch {
        return
    }
}

/** Forgets the note once a sign-in finished, so a later visit to the sign-in screen with a working session leaves it again. */
export const clearSignInMark = (): void => {
    try {
        window.sessionStorage.removeItem(SIGN_IN_MARK_KEY)
    } catch {
        return
    }
}

/** Whether a read sent the reader here to sign in again and no sign-in finished since (false on the server, or when storage is unavailable). */
export const hasSignInMark = (): boolean => {
    try {
        return window.sessionStorage.getItem(SIGN_IN_MARK_KEY) !== null
    } catch {
        return false
    }
}
