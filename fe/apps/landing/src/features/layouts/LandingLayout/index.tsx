import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"
import { Button } from "@starci/grammar/common"
import { BrandLockup, SiteShell } from "@starci-next/ui"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { appUrl } from "@/modules/config"
import { LANDING_ROUTES } from "@/modules/routes"

/** Framework-layout boundary input: the routed page body and nothing else. */
type LandingLayoutProps = { readonly content: ReactNode }

/** The document title and description of the landing, for the language in the address. */
export const landingLayoutMetadata = async (locale: string): Promise<Metadata> => {
    const t = await getTranslations({ locale, namespace: "landing" })
    return { title: t("title"), description: t("description") }
}

/** The chrome of the landing, resolved on the server: the brand lockup, the language menu and the way to sign in, around the routed body. */
export const LandingLayout = async (props: LandingLayoutProps): Promise<ReactElement> => {
    const t = await getTranslations("landing.shell")
    return (
        <SiteShell
            brand={t("brand")}
            brandMark={
                <BrandLockup
                    brand={t("brand")}
                    logoSrc="/brand/logo.png"
                    homeHref={LANDING_ROUTES.home}
                    size="header"
                />
            }
            actions={
                <>
                    <LocaleSwitch />
                    <Button intent="neutral" href={`${appUrl()}/sign-in`}>
                        {t("signIn")}
                    </Button>
                </>
            }
        >
            {props.content}
        </SiteShell>
    )
}
