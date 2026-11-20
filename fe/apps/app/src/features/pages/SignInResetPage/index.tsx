import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES, signInSearch } from "@/modules/routes"
import { SignInResetPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the reset page, from the catalog of the requested locale. */
export const signInResetMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.auth.reset")
    return { title: t("title") }
}

/** The query value the route hands the reset page: the token the emailed link carried. */
type SignInResetPageProps = { readonly token: string | ReadonlyArray<string> | undefined }

/** The page the emailed reset link opens: a server owner that settles the frame and mounts the card that sets the new password. */
export const SignInResetPage = async (props: SignInResetPageProps): Promise<ReactElement> => {
    const locale = await getLocale()
    const signInHref = appI18n.navigation.getPathname({ href: APP_ROUTES.signIn, locale })
    return (
        <SignInResetPageBase
            props={{
                token: typeof props.token === "string" ? props.token : undefined,
                signInHref,
                doneHref: signInHref + signInSearch({ reset: true }),
            }}
        />
    )
}
