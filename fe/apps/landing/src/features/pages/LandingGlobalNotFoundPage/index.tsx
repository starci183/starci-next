import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { GlobalNotFoundNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import messages from "@/modules/i18n/messages/vi.json"
import { LANDING_ROUTES } from "@/modules/routes"

/** The unknown address above every locale segment of the landing: it has no provider, so it reads the default catalog directly. */
export const LandingGlobalNotFoundPage = () => (
    <GlobalNotFoundNotice
        lang={DEFAULT_LOCALE}
        words={{
            title: messages.landing.notFound.title,
            description: messages.landing.notFound.description,
            home: messages.landing.notFound.home,
        }}
        homeHref={LANDING_ROUTES.home}
        staticsBaseUrl={staticsBase()}
    />
)
