import { DEFAULT_LOCALE } from "@starci-next/i18n/routing"
import { GlobalErrorNotice } from "@starci-next/ui"
import { staticsBase } from "@/modules/config"
import messages from "@/modules/i18n/messages/vi.json"

/** The public props of the last-resort error page: the boundary hands it the retry. */
type AppGlobalErrorPageProps = { readonly onRetry: () => void }

/** The last-resort boundary above the locale layout of the product app: it has no provider, so it reads the default catalog directly. */
export const AppGlobalErrorPage = (props: AppGlobalErrorPageProps) => (
    <GlobalErrorNotice
        lang={DEFAULT_LOCALE}
        words={messages.app.errors.global}
        onRetry={props.onRetry}
        staticsBaseUrl={staticsBase()}
    />
)
