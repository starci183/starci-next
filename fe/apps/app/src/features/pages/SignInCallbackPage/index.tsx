import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES, signInSearch } from "@/modules/routes"
import { SignInCallbackPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the callback page, from the catalog of the requested locale. */
export const signInCallbackMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.signInCallback")
    return { title: t("title") }
}

/** The query values the provider return left. */
type SignInCallbackPageProps = {
    readonly code: string | ReadonlyArray<string> | undefined
    readonly state: string | ReadonlyArray<string> | undefined
}

/** The single string of a query value, or undefined when it is missing or repeated. */
const singleOf = (value: string | ReadonlyArray<string> | undefined): string | undefined =>
    typeof value === "string" ? value : undefined

/** The social callback page: it resolves the paths of the reader locale and hands the code and state to the status block. */
export const SignInCallbackPage = async (props: SignInCallbackPageProps): Promise<ReactElement> => {
    const t = await getTranslations("app.signInCallback")
    const locale = await getLocale()
    const { navigation } = appI18n
    return (
        <SignInCallbackPageBase
            props={{
                status: t("status"),
                code: singleOf(props.code),
                state: singleOf(props.state),
                homeHref: navigation.getPathname({ href: APP_ROUTES.home, locale }),
                failureHref:
                    navigation.getPathname({ href: APP_ROUTES.signIn, locale }) + signInSearch({ social: "failed" }),
            }}
        />
    )
}
