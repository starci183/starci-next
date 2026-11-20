import { EntryFrame, Heading, Stack, Text } from "@starci/grammar/common"
import { BrandLockup } from "@starci-next/ui"
import { getLocale, getTranslations } from "next-intl/server"
import type { ReactNode, ReactElement } from "react"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { appI18n } from "@/modules/i18n"
import { APP_ROUTES } from "@/modules/routes"

/** Framework-layout boundary input: the routed page body (the card of the entry task) and nothing else. */
type EntryLayoutProps = { readonly content: ReactNode }

/**
 * The entry frame of the sign-in, confirm and reset pages, resolved on the server: on a desktop the intro of the product (headed by
 * the brand lockup) beside the card, on a phone the brand lockup above it; the language switch sits at the top trailing edge and no
 * app header is drawn. The board has no artwork: the split frame has no variant without it yet (GRAMMAR-GAPS #11).
 */
export const EntryLayout = async (props: EntryLayoutProps): Promise<ReactElement> => {
    const t = await getTranslations("app.auth.entry")
    const brand = (await getTranslations("app.shell"))("brand")
    const locale = await getLocale()
    const lockup = (
        <BrandLockup
            brand={brand}
            logoSrc="/brand/logo.png"
            homeHref={appI18n.navigation.getPathname({ href: APP_ROUTES.home, locale })}
            size="entry"
        />
    )
    return (
        <EntryFrame
            label={brand}
            identity={lockup}
            tools={<LocaleSwitch />}
            footer={null}
            artwork={null}
            intro={
                <Stack gap="section">
                    {lockup}
                    <Heading level={2} scale="standard">
                        {t("headline")}
                    </Heading>
                    <Text tone="muted">{t("lead")}</Text>
                    <Stack gap="row">
                        <Text>
                            <strong>{t("essentials.name")}</strong> {t("essentials.text")}
                        </Text>
                        <Text>
                            <strong>{t("projects.name")}</strong> {t("projects.text")}
                        </Text>
                        <Text>
                            <strong>{t("harness.name")}</strong> {t("harness.text")}
                        </Text>
                    </Stack>
                </Stack>
            }
        >
            {props.content}
        </EntryFrame>
    )
}
