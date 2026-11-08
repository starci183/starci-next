"use client"

import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { useLocale } from "next-intl"
import { markSignInRedirect } from "@/modules/auth"
import { isUnauthenticated } from "@/modules/failure"
import { APP_ROUTES, signInRedirectHref } from "@/modules/routes"

/** The pages a signed-out reader may stay on (site map): the Premium plans and the public verification and profile pages. */
const PUBLIC_PATH = new RegExp(`^(?:/[a-z]{2})?(?:${APP_ROUTES.premium}|/verify/|/u/)`)

/** True when the path is a public page, whose signed-in reads simply stay empty for a signed-out reader. */
const isPublicPath = (path: string): boolean => PUBLIC_PATH.test(path) && !path.includes(APP_ROUTES.premiumResult)

/** What useSignInRedirect answers: the error handler of the app's SWR reads. */
export type SignInRedirectHook = (error: unknown) => void

/**
 * Sends a signed-out reader to the sign-in screen, once, from the one place every read's failure passes (the SWR config
 * `onError`): a read that every door answers with the stable code of a missing session leaves for
 * `[/{locale}]/sign-in?returnTo=<the current path and query>` (the default locale has no prefix) with a full navigation, so the screen starts with no session in any
 * cache; the sign-in screen is told so (it keeps its form even when the session door still answers, so a read the session does not satisfy never loops between the two). Any other failure is left to the slot that drew it. On the sign-in screen itself nothing redirects.
 */
export const useSignInRedirect = (): SignInRedirectHook => {
    const locale = useLocale()
    return (error: unknown): void => {
        if (!isUnauthenticated(error)) return
        const here = window.location.pathname + window.location.search
        const signInPath = (locale === DEFAULT_LOCALE ? "" : `/${locale}`) + APP_ROUTES.signIn
        if (window.location.pathname.startsWith(signInPath)) return
        if (isPublicPath(window.location.pathname)) return
        markSignInRedirect()
        window.location.assign(signInRedirectHref(signInPath, here))
    }
}
