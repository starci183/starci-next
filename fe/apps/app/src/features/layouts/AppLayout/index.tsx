import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"
import { WorkspaceShell } from "@starci/grammar/common"
import { MoreGlyph } from "@starci-next/ui"
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
    const premiumHref = hrefOf(APP_ROUTES.premium)
    const sidebar = (presentation: "rail" | "drawer"): ReactElement => <AppSidebar presentation={presentation} />
    return (
        <WorkspaceShell
            viewport="fixed"
            align="stretch"
            primaryLabel={t("brand")}
            header={
                <AppHeader
                    brand={t("brand")}
                    logoSrc="/brand/starci-logo.png"
                    premiumHref={premiumHref}
                    profileHref={hrefOf(APP_ROUTES.profile)}
                    signInHref={hrefOf(APP_ROUTES.signIn)}
                />
            }
            headerLandmark="slot"
            navigation={sidebar("rail")}
            navigationLabel={t("sidebarLabel")}
            navigationTrack="intrinsic"
            navigationVisibility="wide"
            navigationDrawer={{
                title: t("menuTitle"),
                openLabel: t("menuOpen"),
                closeLabel: t("menuClose"),
                source: MoreGlyph,
                defaultOpen: false,
                content: sidebar("drawer"),
                rowTitle: t("menuOpen"),
            }}
            primary={
                <>
                    {props.content}
                    <SignInModal />
                </>
            }
        />
    )
}
