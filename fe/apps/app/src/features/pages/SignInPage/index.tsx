import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { AUTH_DOORS } from "@/modules/auth"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES } from "@/modules/routes"
import { SignInPageBase } from "./component"
import type { SignInOutcome } from "./component"
import type { ReactElement } from "react"

/** The document title of the sign-in page, from the catalog of the requested locale. */
export const signInMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.signIn")
    return { title: t("title") }
}

/**
 * The only values the identity callback's final redirect may leave in the `/sign-in` query (the contract fixes them and
 * forwards no provider detail): `error` reports a recoverable failure, `success` a settled session. Anything else —
 * a code, a state, an invented flag — is not an outcome and is ignored.
 */
const outcomeOf = (auth: string | ReadonlyArray<string> | undefined): SignInOutcome | undefined => {
    const value = typeof auth === "string" ? auth : auth?.[0]
    if (value === "error") return "failed"
    if (value === "success") return "signed-in"
    return undefined
}

/** What the route hands the sign-in page: the raw `auth` query value the identity callback's redirect left. */
type SignInPageProps = { readonly authOutcome: string | ReadonlyArray<string> | undefined }

/**
 * The sign-in page of the product app: a server owner that resolves the catalog copy, the session door and the
 * locale-aware way onward, and settles the one fixed outcome the callback's redirect may have left.
 */
export const SignInPage = async (props: SignInPageProps): Promise<ReactElement> => {
    const signIn = await getTranslations("app.signIn")
    const feedback = await getTranslations("app.toast")
    const signOut = await getTranslations("app.signOut")
    const errors = await getTranslations("app.errors.page")
    const locale = await getLocale()
    return (
        <SignInPageBase
            props={{
                title: signIn("title"),
                support: feedback("unauthorizedDescription"),
                signInLabel: signIn("title"),
                continueLabel: signIn("submit"),
                failureTitle: errors("title"),
                failureDescription: signIn("unavailable"),
                settledTitle: signOut("signedIn"),
                signInDoor: AUTH_DOORS.signIn,
                continueHref: appI18n.navigation.getPathname({ href: APP_ROUTES.home, locale }),
                outcome: outcomeOf(props.authOutcome),
            }}
        />
    )
}
