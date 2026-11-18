import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { GlobalNotFoundNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import messages from "@/modules/i18n/messages/vi.json"
import { APP_ROUTES } from "@/modules/routes"

/** The unknown address above every locale segment of the app: it has no provider, so it reads the default catalog directly. */
export const AppGlobalNotFoundPage = () => (
    <GlobalNotFoundNotice
        lang={DEFAULT_LOCALE}
        words={{
            title: messages.app.notFound.title,
            description: messages.app.notFound.description,
            home: messages.app.notFound.home,
        }}
        homeHref={APP_ROUTES.home}
        staticsBaseUrl={staticsBase()}
    />
)
