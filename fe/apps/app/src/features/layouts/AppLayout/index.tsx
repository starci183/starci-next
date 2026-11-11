import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"
import { SiteShell } from "@starci-next/ui"
import { AppHeader } from "@/components/blocks/AppHeader"
import { AppSidebar } from "@/components/blocks/AppSidebar"
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

/** The product app's chrome, resolved on the server: the shell with the white sidebar and top bar around the routed body. */
export const AppLayout = async (props: AppLayoutProps): Promise<ReactElement> => {
    const t = await getTranslations("app.shell")
    const locale = await getLocale()
    const hrefOf = (href: string): string => appI18n.navigation.getPathname({ href, locale })
    const homeHref = hrefOf(APP_ROUTES.home)
    const premiumHref = hrefOf(APP_ROUTES.premium)
    const sidebar = (presentation: "rail" | "drawer"): ReactElement => (
        <AppSidebar presentation={presentation} />
    )
    return (
        <SiteShell
            brand={t("brand")}
            homeHref={homeHref}
            header={<AppHeader brand={t("brand")} logoSrc="/brand/starci-logo.png" premiumHref={premiumHref} profileHref={hrefOf(APP_ROUTES.profile)} signInHref={hrefOf(APP_ROUTES.signIn)} />}
            navigation={{
                rail: sidebar("rail"),
                label: t("sidebarLabel"),
                drawerContent: sidebar("drawer"),
                drawerTitle: t("menuTitle"),
                openLabel: t("menuOpen"),
                closeLabel: t("menuClose"),
            }}
        >
            {props.content}
            <SignInModal />
        </SiteShell>
    )
}
