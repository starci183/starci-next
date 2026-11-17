import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES, returnToOf } from "@/modules/routes"
import { SignInPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the sign-in page, from the catalog of the requested locale. */
export const signInMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.auth")
    return { title: t("title") }
}

/** The query values the route hands the sign-in page. */
type SignInPageProps = {
    readonly returnTo: string | ReadonlyArray<string> | undefined
    readonly signedOut: string | ReadonlyArray<string> | undefined
    readonly error: string | ReadonlyArray<string> | undefined
}

/** The one-off notice the query asks for: after a sign-out, or after a social sign-in that did not finish. */
const noticeOf = (props: SignInPageProps): "signedOut" | "socialFailed" | undefined => {
    if (props.error === "social") return "socialFailed"
    return props.signedOut === "1" ? "signedOut" : undefined
}

/**
 * The sign-in page of the product app: a server owner that validates the `returnTo` of the address (only a same-origin
 * relative path counts, else the home path of the reader locale) and settles the notice, then mounts the card.
 */
export const SignInPage = async (props: SignInPageProps): Promise<ReactElement> => {
    const locale = await getLocale()
    const returnTo = returnToOf(props.returnTo)
    const brand = (await getTranslations("app.shell"))("brand")
    const homeHref = appI18n.navigation.getPathname({ href: APP_ROUTES.home, locale })
    return (
        <SignInPageBase
            props={{
                destination: returnTo ?? homeHref,
                notice: noticeOf(props),
                returnTo,
                brand,
                logoSrc: "/brand/starci-logo.png",
                homeHref,
            }}
        />
    )
}
