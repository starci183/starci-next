import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES } from "@/modules/routes"
import { SignInConfirmPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the confirm page, from the catalog of the requested locale. */
export const signInConfirmMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.auth.confirm")
    return { title: t("done.title") }
}

/** The query value the route hands the confirm page: the token the emailed link carried. */
type SignInConfirmPageProps = { readonly token: string | ReadonlyArray<string> | undefined }

/** The page the emailed confirmation link opens: a server owner that settles the frame and mounts the card that spends the token. */
export const SignInConfirmPage = async (props: SignInConfirmPageProps): Promise<ReactElement> => {
    const locale = await getLocale()
    const brand = (await getTranslations("app.shell"))("brand")
    const homeHref = appI18n.navigation.getPathname({ href: APP_ROUTES.home, locale })
    return (
        <SignInConfirmPageBase
            props={{
                token: typeof props.token === "string" ? props.token : undefined,
                brand,
                logoSrc: "/brand/logo.png",
                homeHref,
                signInHref: appI18n.navigation.getPathname({ href: APP_ROUTES.signIn, locale }),
            }}
        />
    )
}
