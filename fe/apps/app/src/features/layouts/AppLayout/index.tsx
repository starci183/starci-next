import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"
import { SiteShell } from "@starci-next/ui"
import { AppHeader } from "@/components/blocks/AppHeader"
import { SignInModal } from "@/features/overlays/SignInModal"
import { siteUrl } from "@/modules/config"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES } from "@/modules/routes"

/** Framework-layout boundary input: the routed page body and nothing else. */
type AppLayoutProps = { readonly content: ReactNode }

/** The document title and the absolute base of every metadata URL, for the language in the address. */
export const appLayoutMetadata = async (locale: string): Promise<Metadata> => {
    const t = await getTranslations({ locale, namespace: "app" })
    return { title: t("title"), metadataBase: new URL(siteUrl()) }
}

/** The product app's chrome, resolved on the server: the shared shell with the app header (brand, navigation, plan, account) around the routed body. */
export const AppLayout = async (props: AppLayoutProps): Promise<ReactElement> => {
    const t = await getTranslations("app.shell")
    const locale = await getLocale()
    const hrefOf = (href: string): string => appI18n.navigation.getPathname({ href, locale })
    const homeHref = hrefOf(APP_ROUTES.home)
    return (
        <SiteShell
            brand={t("brand")}
            homeHref={homeHref}
            header={
                <AppHeader
                    brand={t("brand")}
                    logoSrc="/brand/starci-logo.png"
                    homeHref={homeHref}
                    essentialsHref={hrefOf(APP_ROUTES.essentials)}
                    reviewHref={hrefOf(APP_ROUTES.review)}
                    practiceHref={hrefOf(APP_ROUTES.practice)}
                    projectsHref={hrefOf(APP_ROUTES.projects)}
                    interviewHref={hrefOf(APP_ROUTES.interview)}
                    agentsHref={hrefOf(APP_ROUTES.agents)}
                    premiumHref={hrefOf(APP_ROUTES.premium)}
                    profileHref={hrefOf(APP_ROUTES.profile)}
                    experienceHref={hrefOf(APP_ROUTES.experience)}
                    reviewQueueHref={hrefOf(APP_ROUTES.reviewQueue)}
                    signInHref={hrefOf(APP_ROUTES.signIn)}
                />
            }
        >
            {props.content}
            <SignInModal />
        </SiteShell>
    )
}
