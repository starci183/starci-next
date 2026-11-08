/** The tab-scoped key under which the state of the social sign-in this tab started is kept until its callback. */
const SOCIAL_STATE_KEY = "starci.identity.social-state"

/** The tab's session storage, or null where there is none (server render, storage blocked by the browser). */
const tabStorage = (): Storage | null => {
    if (typeof window === "undefined") return null
    try {
        return window.sessionStorage
    } catch {
        return null
    }
}

/**
 * Keeps the state of the authorization URL this tab is about to follow, so only its own callback is exchanged. Answers
 * false when the tab keeps nothing (no state in the URL, no storage); its callback is then not auto-submitted.
 */
export const rememberSocialState = (authorizationUrl: string): boolean => {
    const state = URL.canParse(authorizationUrl) ? new URL(authorizationUrl).searchParams.get("state") : null
    const storage = tabStorage()
    if (state === null || storage === null) return false
    try {
        storage.setItem(SOCIAL_STATE_KEY, state)
        return true
    } catch {
        return false
    }
}

/**
 * True when `state` is the state of the social sign-in this tab started. A callback link carrying another state (a
 * sign-in someone else started and sent here) is never auto-submitted; the server also refuses it by its binding cookie.
 */
export const isOwnSocialState = (state: string): boolean => {
    const storage = tabStorage()
    if (storage === null) return false
    try {
        return storage.getItem(SOCIAL_STATE_KEY) === state
    } catch {
        return false
    }
}

/** Forgets the state of this tab's social sign-in once its callback was handled; answers whether anything was kept. */
export const forgetSocialState = (): boolean => {
    const storage = tabStorage()
    if (storage === null) return false
    try {
        storage.removeItem(SOCIAL_STATE_KEY)
        return true
    } catch {
        return false
    }
}
